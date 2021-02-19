<script>
    import { onMount, afterUpdate } from "svelte";
    import { userLoggedIn, user } from "./google";
    import { log } from "./utils";
    let signinButton;
    let signoutButton;
    let mounted = false;

    const statusChanged = (p) => {
        if (!mounted) return;
        if ($userLoggedIn) {
            signinButton.style.display = "none";
            signoutButton.style.display = "block";
        } else {
            signinButton.style.display = "block";
            signoutButton.style.display = "none";
        }
    };
    window.onLoadCallback = () => {
        const loggedIn = gapi.auth2.getAuthInstance().isSignedIn.get();
        if ($userLoggedIn != loggedIn) userLoggedIn.set(loggedIn);
        if (loggedIn) {
            log(888, loggedIn);
            onSignIn(gapi.auth2, 8);
        }
    };
    window.onSignIn = (googleUser, p) => {
        const profile = googleUser.getBasicProfile();
        user.set({
            id: profile.getId(),
            name: profile.getName(),
            picture: profile.getImageUrl(),
            email: profile.getEmail(),
            guser: googleUser,
        });
        // if (!$userLoggedIn)
        userLoggedIn.set(true);
    };
    window.signOut = () => {
        const auth2 = gapi.auth2.getAuthInstance();
        auth2.signOut().then(() => {
            // User is now signed out
            window.location.href = "/";
        });
    };

    onMount(() => {
        mounted = true;
    });

    afterUpdate(statusChanged);
</script>

<svelte:head>
    <script
        src="https://apis.google.com/js/platform.js?onload=onLoadCallback"
        async
        defer></script>
</svelte:head>
<div bind:this={signinButton} style="display:none">
    <div
        class="g-signin2"
        data-theme="dark"
        data-longtitle="true"
        data-onsuccess="onSignIn"
    />
</div>
<div bind:this={signoutButton} style="display:none">
    <!-- svelte-ignore a11y-invalid-attribute -->
    <a href="javascript:signOut()">Sign out</a>
    <pre>
    {JSON.stringify($user,null,2)}
    </pre>
</div>
