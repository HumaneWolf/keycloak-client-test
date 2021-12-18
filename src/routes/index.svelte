<script context="module" lang="ts">
	export const prerender = true;
</script>

<script lang="ts">
	import { AuthHandler } from '../auth';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';

	const code = $page.query.get('code');
	let auth: AuthHandler;

	$: nickname = undefined;

	onMount(async () => {
		auth = new AuthHandler();
	});

	const authorizeMe = () => {
		auth?.authorize();
	}

	const tokenMe = () => {
		auth?.getToken(code).then(() => {
			nickname = auth.data.name;
		});
	}

	
	$: returnedData = '';
	const doRequest = () => {
		fetch('http://localhost:5000/getMe', {
			headers: {
				'Authorization': auth.getHeaderValue(),
			}
		}).then(x => x.json())
		.then(x => {
			returnedData = JSON.stringify(x);
		});
	}
</script>

<svelte:head>
	<title>Home</title>
</svelte:head>

<section>
	{#if nickname}
		<h1>Welcome, {nickname}!</h1>
	{/if}

	{#if returnedData}
		<p>{returnedData}</p>
	{/if}

	<div>
		<button on:click={authorizeMe}>Authorize</button>
		<button on:click={tokenMe}>Token</button>
		<button on:click={doRequest}>Call api</button>
	</div>
</section>

<style>
	section {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		flex: 1;
	}

	h1 {
		width: 100%;
	}
</style>
