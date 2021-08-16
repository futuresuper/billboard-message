<script>
	import Logo from '../lib/Logo.svelte';

	let message = 'Look mum, no coal';
	let name = 'Jake L';
	let location = 'Sydney';
	const charsAllowed = 70;
	let charsRemaining = charsAllowed - message.length;

	const handleChange = (event) => {
		const text = event.target.value;
		if (text.length <= charsAllowed) {
			message = text;
		} else {
			message = text.slice(0, charsAllowed);
		}
		charsRemaining = charsAllowed - text.length;
	};
</script>

<main>
	<div class="billboard-container">
		<div class="message-container">
			<h2 id="message-on-billboard">{message}</h2>
			<p id="name-and-location-on-billboard">{name}, {location}</p>
		</div>
	</div>
	<div class="input-container">
		<div class="logo-container">
			<Logo />
		</div>
		<form name="Billboard Entry" method="POST" data-netlify="true">
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
			<label for="name">Name</label>
			<input bind:value={name} type="text" id="name" name="name" required="required" />
			<label for="location">Location</label>
			<input bind:value={location} type="text" id="location" name="location" required="required" />
			<button type="submit">Submit</button>
		</form>
	</div>
</main>

<footer>
	<p>
		We acknowledge the Traditional Custodians of the lands on which we operate. We pay our respects
		to their Elders, past, present and emerging, and recognise that sovereignty was never ceded. See
		our <a
			href="https://www.futuresuper.com.au/rap"
			style="color: black; text-decoration: underline;">Reconciliation Action Plan.</a
		>
	</p>
	<p>
		All information provided is general in nature only. We recommend you seek financial advice when
		considering if Future Super is right for your objectives and needs. When considering returns,
		past performance is not indicative of future performance.
	</p>
	<p class="footer-links">
		<a href="https://www.futuresuper.com.au/fund-information/">Fund Information</a>
		•
		<a href="https://www.futuresuper.com.au/terms-and-conditions/">Terms & Conditions</a>
		•
		<a href="https://www.futuresuper.com.au/privacy-policy/">Privacy Policy</a>
	</p>
</footer>

<style>
	main {
		display: flex;
		flex-direction: row;
	}
	.billboard-container {
		width: 75vw;
		height: 100vh;
		/* overflow: hidden; */
		background-image: url('https://res.cloudinary.com/future-super/image/upload/f_auto,q_auto/v1629081534/Billboard_Centred.png');
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
		margin-bottom: 36px;
		font-size: 15px;
		border: 0;
		border-radius: 10px;
		outline: none;
		font-family: inherit;
	}
	textarea {
		margin-bottom: 0;
	}
	.chars-remaining {
		color: white;
		font-size: 12px;
		text-align: right;
		margin-bottom: 36px;
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
	footer {
		background-color: white;
		color: black;
		padding: 4vw;
	}
	.footer-links > a {
		color: black;
	}
	@media (max-width: 600px) {
		main {
			flex-direction: column;
		}
		.billboard-container {
			width: 100%;
		}
		.message-container {
			top: 12vw;
			left: 12vw;
			width: 43vw;
			height: 32vw;
		}
		label {
			font-size: 14px;
		}
		input {
			font-size: 14px;
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
