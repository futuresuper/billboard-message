<script>
	import Logo from '../lib/Logo.svelte';
	import { onMount } from 'svelte';
	import { prevent_default } from 'svelte/internal';
	import Footer from '../lib/Footer.svelte';

	let firstInitial = '';
	let lastName = '';
	let message = 'Look mum, no coal';
	let location = '';
	let email = '';
	let memberNumber = '';
	const charsAllowed = 70;
	let charsRemaining = charsAllowed - message.length;
	let formValid = true;
	let showModal = 'intro';

	// Set name and location if query vars exist
	onMount(async () => {
		var query = window.location.search.substring(1);
		var vars = query.split('&');
		for (var i = 0; i < vars.length; i++) {
			var pair = vars[i].split('=');
			if (decodeURIComponent(pair[0]) == 'first') {
				firstInitial = decodeURIComponent(pair[1])[0];
			}
			if (decodeURIComponent(pair[0]) == 'last') {
				lastName = decodeURIComponent(pair[1]);
			}
			if (decodeURIComponent(pair[0]) == 'location') {
				location = decodeURIComponent(pair[1]);
			}
			if (decodeURIComponent(pair[0]) == 'email') {
				email = decodeURIComponent(pair[1]);
			}
			if (decodeURIComponent(pair[0]) == 'member') {
				memberNumber = decodeURIComponent(pair[1]);
			}
		}
	});

	const handleChange = (event) => {
		const text = event.target.value;
		if (text.length <= charsAllowed) {
			message = text;
			formValid = true;
		} else {
			formValid = false;
		}
		charsRemaining = charsAllowed - text.length;
	};

	const hideModal = () => {
		showModal = 'none';
	};

	async function postData(url = '', data = {}) {
		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(data)
		});
		return response.json(); // parses JSON response into native JavaScript objects
	}

	function handleSubmit() {
		if (formValid) {
			postData(
				'https://67l8qspd50.execute-api.ap-southeast-2.amazonaws.com/prod/billboardmessage',
				{
					name: firstInitial + '.' + lastName,
					location,
					message,
					email,
					memberNumber
				}
			);
			showModal = 'success';
			window.scrollTo(0, 0);
		}
	}
</script>

<main>
	{#if showModal === 'intro'}
		<div id="modal">
			<div class="modal-box">
				<h2>
					Your super is powerful. You're already using it to invest in climate solutions. Make a
					billboard, so others can too.
				</h2>
				<hr />
				<h3>Some helpful tips and tricks</h3>
				<p>Swearing won’t get your billboard up in lights</p>
				<p>Innuendo won’t get you to the end-o</p>
				<p>Make it personal</p>
				<p>Have fun</p>
				<button on:click={() => hideModal()}>Let's Go!</button>
			</div>
		</div>
	{/if}
	{#if showModal === 'success'}
		<div id="modal">
			<div class="modal-box">
				<h2>Thanks!</h2>
				<h3>
					Thanks for sending in your billboard! We’ll let you know if we decide to use your
					submission.
				</h3>
				<hr />
				<p>Looking for something to do now?</p>
				<p>
					How about
					<a style="color:black" href="https://www.youtube.com/channel/UCQe4jv35dFXsMRS1MWu00kA"
						>checking out our Youtube channel</a
					>
				</p>
			</div>
		</div>
	{/if}

	<div class="billboard-container">
		<img
			class="billboard-mobile"
			src="https://res.cloudinary.com/future-super/image/upload/f_auto,q_auto/v1628831547/Billboard_Mockup_1.png"
			alt=""
		/>
		<div class="message-container">
			<h2 id="message-on-billboard">{message}</h2>
			<p id="name-and-location-on-billboard">{firstInitial}.{lastName}, {location}</p>
		</div>
	</div>
	<div class="input-container">
		<div class="logo-container">
			<Logo />
		</div>
		<form name="Billboard Entry" on:submit|preventDefault={() => handleSubmit()}>
			<label for="message">Message</label>
			<textarea
				on:keyup={(event) => handleChange(event)}
				value={message}
				type="text"
				id="message"
				name="message"
				required="required"
				rows="3"
			/>
			<p class="chars-remaining">
				<span style="color: {charsRemaining > -1 ? '#3dfa52' : '#FF6464'}">{charsRemaining}</span> characters
				remaining
			</p>
			<div class="name-row">
				<div class="initial">
					<label for="first-initial">First Initial</label>
					<input
						bind:value={firstInitial}
						type="text"
						id="first-initial"
						name="first-initial"
						required="required"
					/>
				</div>
				<div class="last">
					<label for="last-name">Last Name</label>
					<input
						bind:value={lastName}
						type="text"
						id="last-name"
						name="last-name"
						required="required"
					/>
				</div>
			</div>
			<label for="location">Location</label>
			<input bind:value={location} type="text" id="location" name="location" required="required" />
			<label for="email">Email</label>
			<input bind:value={email} type="email" id="email" name="email" required="required" />
			<input
				bind:value={memberNumber}
				type="text"
				id="member-number"
				name="member-number"
				style="display:none"
			/>
			<button type="submit" class={formValid ? '' : 'not-valid'}>
				{formValid ? 'Submit' : 'Make message shorter'}
			</button>
		</form>
	</div>
</main>

<Footer />

<style>
	@media (min-width: 1000.1px) {
		.billboard-container {
			background-image: url('https://res.cloudinary.com/future-super/image/upload/f_auto,q_auto/v1629081534/Billboard_Centred.png');
		}
		.billboard-mobile {
			display: none;
		}
	}
	#modal {
		display: fixed;
		position: absolute;
		width: 100%;
		height: 100vh;
		background-color: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(2px);
		padding: 40px;
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 99;
	}
	.modal-box {
		background-color: white;
		max-width: 600px;
		padding: 40px;
		text-align: center;
		border-radius: 40px;
	}
	.modal-box > h2 {
		margin-top: 0;
	}
	main {
		display: flex;
		flex-direction: row;
	}
	.billboard-container {
		width: 75vw;
		height: 100vh;
		/* overflow: hidden; */
		background-repeat: no-repeat;
		background-position: left center;
		background-size: cover;
	}
	.logo-container {
		text-align: right;
	}
	.message-container {
		position: absolute;
		left: 8.5vw;
		top: 50vh;
		width: 29vw;
		height: 22vw;
		margin-top: -11vw;
		color: white;
		/* background-color: yellow; */
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
	}
	#message-on-billboard {
		font-size: 48px;
		margin: 4px 0;
	}
	#name-and-location-on-billboard {
		font-size: 18px;
		margin: 0;
	}
	.input-container {
		background-color: black;
		padding: 2vw;
		margin-left: -40px;
		max-height: 100vh;
		flex-grow: 1;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		border-radius: 40px 0 0 40px;
	}
	label {
		color: white;
		font-size: 15px;
		display: block;
		margin-bottom: 12px;
	}
	input,
	textarea {
		display: block;
		width: 100%;
		padding: 8px 12px;
		margin-bottom: 24px;
		font-size: 15px;
		border: 0;
		border-radius: 10px;
		outline: none;
		font-family: inherit;
	}
	.name-row {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
	}
	.initial {
		width: 30%;
	}
	.last {
		width: 65%;
	}
	textarea {
		margin-bottom: 0;
	}
	.chars-remaining {
		color: white;
		font-size: 12px;
		text-align: right;
		margin-bottom: 24px;
	}
	button {
		width: 100%;
		font-size: 15px;
		background-color: #3dfa52;
		color: black;
		border: 0;
		border-radius: 100px;
		padding: 10px 24px;
		margin-top: 12px;
	}
	button:hover {
		cursor: pointer;
	}
	button.not-valid {
		background-color: gray;
		cursor: no-drop;
	}
	@media (max-width: 1000px) {
		main {
			flex-direction: column;
		}
		#modal {
			padding: 30px;
			height: 140vh;
			align-items: flex-start;
		}
		.modal-box {
			padding: 30px;
			text-align: center;
			border-radius: 40px;
		}
		.modal-box > h2 {
			font-size: 20px;
		}
		.modal-box > h3 {
			font-size: 16px;
		}
		.modal-box > p {
			font-size: 14px;
		}
		.billboard-container {
			width: 100%;
			height: auto;
			background-size: contain;
			background-position: top;
		}
		.billboard-mobile {
			width: 100%;
		}
		.message-container {
			top: 23vw;
			left: 12vw;
			width: 43vw;
			height: 32vw;
		}
		.input-container {
			padding: 10vw 4vw;
			margin: -40px 0 0 0;
			max-height: 100vh;
			display: block;
			width: 100%;
			border-radius: 40px 40px 0 0;
		}
		.logo-container {
			display: none;
		}
		label {
			font-size: 14px;
			margin-bottom: 6px;
		}
		input {
			font-size: 14px;
			margin-bottom: 12px;
		}
		.chars-remaining {
			margin-bottom: 12px;
		}
		button {
			font-size: 14px;
		}
		#message-on-billboard {
			font-size: 16px;
			margin: 4px 0;
		}
		#name-and-location-on-billboard {
			font-size: 12px;
		}
	}
</style>
