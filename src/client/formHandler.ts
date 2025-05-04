export const handleSignup = async (username: string, password: string) => {
  // Basic validation for username and password
  if (!username || !password) {
    alert("Username and password are required.");
    return;
  }

  try {
    const response = await fetch("/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    const result = await response.json();

    if (response.ok) {
      alert("User created successfully!");
      console.log(result);

      await handleSignin(username, password);
    } else {
      alert(result.message || "Error creating user");
    }
  } catch (error) {
    console.error("Error occurred:", error);
    alert("An error occurred while creating the user. Please try again.");
  }
};

export const handleSignin = async (username: string, password: string) => {
  // Basic validation for username and password
  if (!username || !password) {
    alert("Username and password are required.");
    return;
  }

  try {
    const response = await fetch("/signin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    const result = await response.json();

    if (response.ok) {
      localStorage.setItem("token", result.token);
      console.log("Token:", result.token); // Store the token in local storage or handle it as needed
      alert("User signed in successfully!");
      console.log(result); // You can handle the result if needed, like storing JWT or redirecting
      window.location.href = "/"; // Redirect to the lobby page
    } else {
      alert(result.message || "Error signing in");
    }
  } catch (error) {
    console.error("Error occurred:", error);
    alert("An error occurred while signing in. Please try again.");
  }
};
