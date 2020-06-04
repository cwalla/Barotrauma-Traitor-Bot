const Discord = require('discord.js');
const client = new Discord.Client();
//IMPORTANT: Comment out these two lines before Heroku deployment:
const auth = require('./token.json');
const token = auth.token;

const scenarios = require('./scenarios.json');
let allSessions = new Map();
const PASS = ":white_check_mark:";
const FAIL = ":x:";

//IMPORTANT: Comment out this line before Heroku deployment:
client.login(token);
//IMPORTANT: Uncomment this line for Heroku deployment:
//client.login(process.env.BOT_TOKEN);
client.on('ready', () => {
 console.log(`Logged in as ${client.user.tag}!`);
 });

//Event listener for command messages
client.on('message', message => {
   if (message.content === '!ping') {
     message.channel.send('Pong!');
   }

   //Set a random player as the traitor
   if (message.content === '!rolltraitor'||message.content === '!roll') {
     try {
       if (!message.member.voice.channel) {
         return message.reply(`You aren't in any voice channels!` )
       }
       const chanID = message.member.voice.channel.id;
       const session = new Session(message);
       allSessions.set(chanID, session);
       session.initTraitor();
       message.reply(`There's a traitor in your midst...`);
     } catch (err) {
       message.channel.send("`Error: Can't do this in a DM channel.`");
       console.log(err);
     }
   }

   //Set a specific player as the traitor
   if (message.content.startsWith("!settraitor")) {
     try {
       const member = message.mentions.members.first();
       if (!member) {
        return message.reply('Specified user is not a member of the server.  Syntax:\n' +
          '`!settraitor @<userName>`');
        }
      if (member.user.bot) {
        return message.channel.send(`"Hello, me...  Meet the *real* me!\n` +
        `\`Hint: Bots cannot be traitors.\``);
      }
      if (!message.member.voice.channel) {
        return message.reply('You aren\'t in any voice channels!' );
      }
      const chanID = message.member.voice.channel.id;
      const session = new Session(message, member);
      allSessions.set(chanID, session);
      session.initTraitor();
    } catch (err) {
       message.channel.send("`Error: Can't do this in a DM channel.`");
       console.log(err);
      }
   }

   //Reveal who the traitor was
   if (message.content === '!reveal') {
     try {
       if (!message.member.voice.channel) {
         return message.reply('You aren\'t in any voice channels!' );
       }
       let session = allSessions.get(message.member.voice.channel.id);

       if (typeof(session) === 'undefined') {
         return message.channel.send('Nobody is the traitor...\n\nYet...');
       }
       message.channel.send(`The traitor was ${session.traitor.displayName}!\n` +
         `Their task was: ${session.mission.currentTask.task}\n` +
         `Mission Complete: ${session.mission.currentTask.complete}`);
    } catch (err) {
      message.channel.send("`Error: Can't do this in a DM channel.`");
      console.log(err);
    }
   }

   //Clear all traitors
   if (message.content === '!clear') {
     try {
       if (!message.member.voice.channel) {
         return message.reply('You aren\'t in any voice channels!' );
       }
       allSessions.delete(message.member.voice.channel.id);
       message.channel.send('Traitors have been cleared.');
     } catch (err) {
      message.channel.send("`Error: Can't do this in a DM channel.`");
      console.log(err);
    }
   }

   //Traitor surrenders and rejoins the crew
   if (message.content === '!surrender') {
     try {
       let foundTraitor = false;
       for (const session of allSessions.values()) {
         if (message.author.id === session.traitor.user.id) {
           foundTraitor = true;
           message.channel.send(`Coward! You have surrendered.`);
           session.textChan.send(`${session.traitor.displayName} has surrendered to rejoin the crew!`);
         }
         if (foundTraitor === false) {
           message.reply(`You don't appear to be a traitor. Keep up the good work!`);
         }
       }
     } catch (err) {
       message.channel.send(`\`Oops, that's didn't work. :(\``);
       console.log(err);
     }
   }

   //Traitor indicates success for their assigned task
   if (message.content === '!success') {
     try {
       let foundTraitor = false;
       for (const session of allSessions.values()) {
         if (message.author.id === session.traitor.user.id) {
           foundTraitor = true;
           session.mission.currentTask.complete = true;
           session.mission.nextTask();
           message.channel.send(`Congratulations. Here's your next assignment:`);
           session.messageTraitor();
         }
       }
       if (foundTraitor === false) {
         message.reply(`You don't appear to be a traitor. Keep up the good work!`);
       }
     } catch (err) {
       message.channel.send("`Oops, that's didn't work. :(`");
       console.log(err);
     }
   }

   //Traitor indicates failure for their assigned task
   if (message.content === '!failure' || message.content === '!fail') {
     try {
       let foundTraitor = false;
       for (const session of allSessions.values()) {
         if (message.author.id === session.traitor.user.id) {
           foundTraitor = true;
           session.mission.nextTask();
           message.channel.send(`Disappointing... Here's your next assignment:`);
           session.messageTraitor();
         }
       }
       if (foundTraitor === false) {
         message.reply(`You don't appear to be a traitor. Keep up the good work!`);
       }
     } catch (err) {
       message.channel.send(`\`Oops, that's didn't work. :(\``);
       console.log(err);
     }
   }

   // Displays the manual
   if (message.content === '!help'||message.content === '!rtfm') {
     message.channel.send(
       'Baro Bot Commands:\n' + '\n'
       + '```\n' + '\n'
       + '!ping: Check if Barry is online.\n'
       + '!rolltraitor: Randomly select a traitor.\n'
       + '!reveal: Reveal who the traitor was.\n'
       + '!settraitor @<userName>: Make a player the traitor.\n'
       + '!clear: Clears all currently set traitors.\n'
       + '-------DM Commands:--------\n'
       + '!success: Marks the current task as complete for the traitor.\n'
       + '!surrender: Give in and remove yourself as traitor.  Alerts the session text channel.'
       + '```'
     );
   }

   //Dump variables to console.  Deprecate after testing.
   if (message.content === '!dump') {
     try {
       console.log('Current Channel members:');
       console.log(initCrew(message));
       console.log('Current scenarios:');
       console.log(scenarios.majorTasks);
     } catch (e) {
       console.log(e);
     } finally {
       console.log(allSessions);
     }
    }
 });

class Session {
   constructor (message, traitor){
     this.crew = initCrew(message);
     this.traitor = traitor || this.crew[getRandomInt(this.crew.length)];
     this.mission = getRandomMission(scenarios);
     this.textChan = message.channel;
   }
   messageTraitor() {
     this.traitor.send(`**Commence operation:** ${this.mission.currentTask.name}\n` +
     `**Your mission:** ${this.mission.currentTask.task}\n` +
     `**PS:** ${this.mission.currentTask.tip}`);
   }
   initTraitor() {
          this.traitor.send(`You are the traitor.\n`);
          this.messageTraitor();
   }
 }

class Mission {
  constructor (minor1, minor2, major) {
    this.tasks = [minor1, minor2, major];
    this.currentTask = this.tasks[0];
  }
  nextTask() {
    if (this.tasks.indexOf(this.currentTask) < 2) {
      this.currentTask = this.tasks[this.tasks.indexOf(this.currentTask)+1];
    }
  }
}

//Generate an integer between 0 and max, exclusive of max
function getRandomInt(max) {
   return Math.floor(Math.random() * Math.floor(max));
 }

 //Returns an array of voice channel members
function initCrew(message){
  let chanUsers = [];
  let vChan = message.member.voice.channel;
  for (const [memberID, member] of vChan.members) {
    message.channel.send(`Adding ${member.displayName}`);
    chanUsers.push(member);
  }
  return chanUsers;
}

//Pick a scenario at Random
function getRandomMission(scenarios) {
  const mainTask = scenarios.majorTasks[getRandomInt(scenarios.majorTasks.length)];
  const minorTask = scenarios.minorTasks[getRandomInt(scenarios.minorTasks.length)];
  const mischiefTask = scenarios.mischiefTasks[getRandomInt(scenarios.mischiefTasks.length)];
  const mission = new Mission(mischiefTask, minorTask, mainTask);
  return mission;
}
