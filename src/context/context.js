import React, { useState, useEffect } from "react";
import mockUser from "./mockData.js/mockUser";
import mockRepos from "./mockData.js/mockRepos";
import mockFollowers from "./mockData.js/mockFollowers";
import axios from "axios";

const rootUrl = "https://api.github.com";

const GithubContext = React.createContext();

const GithubProvider = ({ children }) => {
	const [githubUser, setGithubUser] = useState(mockUser);
	const [repos, setRepos] = useState(mockRepos);
	const [githubFollowers, setGithubFollowers] = useState(mockFollowers);
	const [requests, setRequests] = useState(0);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState({ show: false, msg: "" });

	const checkRequests = () => {
		axios(`${rootUrl}/rate_limit`).then(({ data }) => {
			let {
				rate: { remaining },
			} = data;
			setRequests(remaining);
			if (remaining === 0) {
				toggleError(true, "sorry, you have exceeded your hourly rate limit");
			}
		});
	};

	const searchGithubUsers = async (user) => {
		toggleError();
		setIsLoading(true);
		const response = await axios(`${rootUrl}/users/${user}`).catch((err) =>
			console.log(err)
		);
		console.log(response);
		if (response) {
			setGithubUser(response.data);
			const { login, followers_url } = response.data;

			// repos
			const repos = await axios(
				`${rootUrl}/users/${login}/repos?per_page=100`
			).then((response) => {
				console.log(response.data);
				setRepos(response.data);
			});

			// followers
			const followers = await axios(`${followers_url}?per_page=100`).then(
				(response) => {
					console.log(response.data);
					setGithubFollowers(response.data);
				}
			);

			// to get all data at the same time i.e: user,followers,following,repos
			await Promise.allSettled([repos, followers]);
		} else {
			toggleError(true, "there is no username with that username");
		}
		checkRequests();
		setIsLoading(false);
	};

	const toggleError = (show = false, msg = "") => {
		setError({ show, msg });
	};

	useEffect(checkRequests, []);

	return (
		<GithubContext.Provider
			value={{
				githubUser,
				repos,
				githubFollowers,
				requests,
				error,
				searchGithubUsers,
				isLoading,
			}}
		>
			{children}
		</GithubContext.Provider>
	);
};

export { GithubContext, GithubProvider };
