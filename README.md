# Barotrauma-Traitor-Bot
A Discord bot that manages randomized traitors for Barotrauma.

Link to invite this bot to server: https://discordapp.com/api/oauth2/authorize?client_id=706605230023901225&permissions=3072&scope=bot

IMPORTANT: The master branch is set up to auto-deploy to Heroku.  All PRs should be to the inDev branch.  Please do not commit directly to Master.

## Command Syntax

    !ping: Check if Barry is online.
    !rolltraitor: Randomly select a traitor.
		!reveal: Reveal who the traitor was.
		!settraitor @<userName>: Make a player the traitor.
		!clear: Clears all currently set traitors.
		--------DM Commands:--------
		!success: Marks the current task as complete for the traitor and provides the next task.
		!failure | !fail: Marks the current traitor task incomplete and provides the next task.
		!surrender: Give in and remove yourself as traitor.  Alerts the session text channel


## How to install dependencies / Set up dev environment

* Install Node.js 12.16.3 from https://nodejs.org/en/
  * Allow it to install dependencies, as you will also need npm and the ability to compile certain modules
	* The full install includes Chocolatey, which can be used to install Git later
	* This will also add npm to the system path
	* Open a powershell prompt
	* Change the execution policy for powershell to allow scripts:
		* Set-ExecutionPolicy -ExecutionPolicy unrestricted -Scope process
			* NOTE: This potentially poses a small security risk to your system.  Documentation can be found here: https://docs.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_execution_policies?view=powershell-7#execution-policy-scope
			* To check the current policy: Get-ExecutionPolicy -List
* Run npm install discord.js
* Run npm install nodemon --save-dev

 You should now be able to start the bot running by running "npm run dev" from a powershell prompt in the root of your local repo.
 Nodemon will re-load the bot if it detects the code has been modified and saved.
 Note that the master branch version of the bot will NOT run locally because it uses environment variables that are set up in Heroku.
 For local testing, use the inDev branch, or check the comments in main.js for which lines to comment out/uncomment.

------------------------------------------------------------------------------

## Using Git

	* Open a Powershell CLI:
		* Run choco install -y git
	* Setup Git:
		* Run git config user.name "your user name"
		* Run git config --global user.email "your commit email"
			* To use an anonymous email, see https://github.com/settings/emails for your gitHub no-reply address
		* Run git config --global credential.helper wincred
			* This will cache your gitHub credentials for commits
	* Clone the Repo:
		* Run git clone https://github.com/cwalla/Barotrauma-Traitor-Bot.git

To configure Atom editor to interface with your Git install:

		* git config --global core.editor "atom --wait"

If using Notepad++ with Git:

		* $ git config --global core.editor "'C:/Program Files (x86)/Notepad++/notepad++.exe' -multiInst -notabbar -nosession -noPlugin"
