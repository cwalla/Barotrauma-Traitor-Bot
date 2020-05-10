# Barotrauma-Traitor-Bot
A Discord bot that manages randomized traitors for Barotrauma.

Link to invite this bot to server: https://discordapp.com/api/oauth2/authorize?client_id=706605230023901225&permissions=3072&scope=bot

Command Syntax:

	* !ping: Check if Barry is online.
	* !rolltraitor | !roll: Randomly select a traitor.
	* !reveal: Reveal who the traitor was.
	* !settraitor @<userName>: Make a player the traitor.
	* !self: Set yourself as the traitor.
	* !clear: Clears all currently set traitors.
	* !help: Display the Man page in discord
	* !dump: Logs the state of various globals to the process console
  

How to install dependancies / Set up dev environment:

	* Install Node.js 12.16.3 from https://nodejs.org/en/
    * Allow it to install dependencies, you will also need npm and the ability to compile certain modules
		* This will also add npm to the system path
	* Open a powershell prompt
	* Change the execution policy for powershell to allow scripts:
		* Set-ExecutionPolicy -ExecutionPolicy unrestricted -Scope process
			* NOTE: This potentially poses a small security risk to your system.  Documentation can be found here: https://docs.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_execution_policies?view=powershell-7#execution-policy-scope
			* To check the current policy: Get-ExecutionPolicy -List
	* Run npm install discord.js
	* Run npm install nodemon --save-dev
