/**
 * 1. form client side info
 * 2. generate token jwt.sign()
 * 3. on client side set token to the localstorage
 */

// for dealing with httpOnly Cookies
/**
 * 
 * 1. from client side send the information (email, better: firebase auth token) to generate token
 * 2. on the server side accept user information and if needed validate it and then generate token in the server side
 * 3. generate token in server side using secret and expiresIn
 * 
 * ---------
 * 
 * set token to the cookies
 * 4. while calling the api tell to use withCredentials
 
 * axios
	.post("http://localhost:3000/jwt", userData, {
		withCredentials: true, // Include cookies in the request
	})

 * 5. in the cors setting set credentials and origin
    app.use(
        cors({
            origin: ["http://localhost:5173"], // client side link
            credentials: true, // allow cookies
        }),
    );
 
 * 6. after generating the token set it to the cookies with some options
		res.cookie("token", token, {
			httpOnly: true,
			secure: false,
		});
 *
 * 7. one time: use cookie-parser as middleware
 * 8. for every api you want to verify token in the client side:
 * if using
 * axios: {withCredentials: true}
 * for fetch: credentials: 'include'
 
    const myApplicationsPromise = (email) => axios.get(`http://localhost:3000/applications?email=${email}`, {
        withCredentials: true, // Include cookies in the request
    });

 * ------------------
 * verify token
 * 9. check if token exists. if not return 401 --> unauthorized
 * otherwise 
 * use jwt.verify() function. if error return 401 --> unauthorized
 * 10. if token is valid set the decoded value to the request object
 * 11. if data asking for doesn't match with the owner of the token then return 403 --> Forbidden
 */
