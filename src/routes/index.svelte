<script>
	let message = 'Look mum, no coal';
	let name = 'Jake L';
	let location = 'Sydney';
</script>

<main>
	<div class="billboard-container">
		<img
			class="billboard-img"
			src="https://res.cloudinary.com/future-super/image/upload/v1628830961/Billboard_Mockup_1.jpg"
			alt="Future Super billboard mockup with space for you to write a message"
		/>
		<div class="message-container">
			<h2 id="message-on-billboard">{message}</h2>
			<p id="name-and-location-on-billboard">{name}, {location}</p>
		</div>
	</div>
	<div class="input-container">
		<form name="Billboard Entry" method="POST" data-netlify="true">
			<label for="message">Message</label>
			<input bind:value={message} type="text" id="message" name="message" required="required" />
			<label for="name">Name</label>
			<input bind:value={name} type="text" id="name" name="name" required="required" />
			<label for="location">Location</label>
			<input bind:value={location} type="text" id="location" name="location" required="required" />
			<button type="submit">Submit</button>
		</form>
	</div>
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
	}
	.billboard-container {
		width: 100%;
	}
	.billboard-img {
		width: 100%;
	}
	.message-container {
		position: absolute;
		top: 12vw;
		left: 12vw;
		width: 43vw;
		height: 32vw;
		color: white;
		/* background-color: yellow; */
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
	}
	#message-on-billboard {
		font-size: 16px;
		margin: 4px 0;
	}
	#name-and-location-on-billboard {
		font-size: 12px;
		margin: 0;
	}
	.input-container {
		background-color: black;
		padding: 2vw;
		flex-grow: 1;
	}
	label {
		color: white;
		font-size: 14px;
		display: block;
		margin-bottom: 4px;
	}
	input {
		display: block;
		padding: 6px;
		margin-bottom: 12px;
		font-size: 14px;
		border: 0;
		outline: none;
	}
	button {
		font-size: 14px;
		background-color: black;
		color: white;
		border: 1px solid #00ff00;
		border-radius: 100px;
		padding: 6px 24px;
		margin-top: 12px;
	}
	button:hover {
		cursor: pointer;
	}
	@media (min-width: 600px) {
		main {
			flex-direction: row;
		}
		.billboard-container {
			width: 70vw;
		}
		.message-container {
			top: 9vw;
			left: 9vw;
			width: 29vw;
			height: 22vw;
		}
		label {
			font-size: 26px;
		}
		input {
			font-size: 26px;
		}
		button {
			font-size: 26px;
		}
		#message-on-billboard {
			font-size: 48px;
			margin: 4px 0;
		}
		#name-and-location-on-billboard {
			font-size: 18px;
		}
	}
</style>
