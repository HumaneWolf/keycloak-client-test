<script context="module" lang="ts">
	export const prerender = true;
</script>

<script lang="ts">
	import Counter from '$lib/Counter.svelte';
	import { AuthHandler } from '../auth';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';

	const code = $page.query.get('code');
	let auth: AuthHandler;

	onMount(async () => {
		auth = new AuthHandler();
	});

	const authorizeMe = () => {
		auth?.authorize();
	}

	const tokenMe = () => {
		auth?.getToken(code);
	}

</script>

<svelte:head>
	<title>Home</title>
</svelte:head>

<section>
	<h1>Welcome!</h1>

	<div>
		<button on:click={authorizeMe}>Authorize</button>
		<button on:click={tokenMe}>Token</button>
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
