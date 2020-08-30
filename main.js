const Discord = require('discord.js');
const fs = require('fs');
const scenarios = require('./scenarios.json');
const client = new Discord.Client();
let allSessions = new Map();
let token;
let stats;
let logStatsEnabled = true;
const PASS = ":white_check_mark:";
const FAIL = ":x:";

if (process.env.HEROKU == 'TRUE') {
  console.log(`Heroku detected.`);
  token = process.env.BOT_TOKEN;
} else {
  console.log(`Heroku not detected.`);
  const auth = require('./token.json');
  token = auth.token;
}

client.login(token);

client.on('ready', () => {
  console.log(`Running Node version ${process.versions.node} on ${process.platform}`);
  console.log(`Logged in as ${client.user.tag}!`);
  fs.readFile('stats.json', (err, data) => {
    if (err) {
      console.log(err);
      return;
    }
    stats = JSON.parse(data);
    console.log(stats);
  });
 });

//Event listener for command messages
client.on('message', message => {
   if (message.content === '!ping') {
     message.channel.send('Pong!');
     stats.pingCount++;
     saveStats();
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
       session.assignTasks();
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
       if (session.traitor === `Surrendered`) {
         message.channel.send(`The traitor was an ultimate failure!\n` +
          `They decided to surrender!\n` +
          `**Their mission was:**\n` +
          `${session.mission.getStatus()}`);
       } else {
         message.channel.send(`The traitor was **${session.traitor.displayName}**!\n` +
          `**Their mission was:**\n` +
          `${session.mission.getStatus()}`);
       }
    } catch (err) {
      message.channel.send("`Error: Can't do this in a DM channel.`");
      console.log(err);
    }
   }

   //Clear current session
   if (message.content === '!clear') {
     try {
       if (!message.member.voice.channel) {
         return message.reply('You aren\'t in any voice channels!' );
       }
       allSessions.delete(message.member.voice.channel.id);
       message.channel.send('Your session has been cleared.');
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
           session.traitorSurrender();
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
       stats.tasksCompleted++;
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
           stats.tasksFailed++;
           saveStats();
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
     message.channel.send('Baro Bot Commands:\n'
       + '```'
       + '!ping: Check if Barry is online.\n'
       + '!rolltraitor: Randomly select a traitor.\n'
       + '!reveal: Reveal who the traitor was.\n'
       + '!settraitor @<userName>: Make a player the traitor.\n'
       + '!clear: Clears your current session.\n'
       + '--------DM Commands:--------\n'
       + '!success: Marks the current traitor task complete and provides the next task.\n'
       + '!failure | !fail: Marks the current traitor task incomplete and provides the next task.\n'
       + '!surrender: Give in and remove yourself as traitor.  Alerts the session text channel.'
       + '```'
     );
   }

   //Display user stats in channels
   if (message.content === '!stats') {
     if (!logStatsEnabled) {
       message.channel.send(`*Note: logging is OFF - Updated stats will not be saved.*`);
     }
     message.channel.send(`Barotrauma Statistics:\n ${JSON.stringify(stats, null, 2)}`);
   }

   //Toggle stats logging for testing purposes
   if (message.content === '!togglestats') {
     logStatsEnabled = logStatsEnabled ? false : true;
     message.reply(`Stats logging enabled: ${logStatsEnabled}`);
     console.log(`Log Stats: ${logStatsEnabled}`);
   }

   //Dump variables to console.  Deprecate after testing.
   if (message.content === '!dump') {
     try {
       console.log(stats)
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
          stats.traitorsRolled++;
          saveStats();
   }
   //remove the session's traitor
   traitorSurrender() {
      this.traitor = `Surrendered`;
      stats.surrenders++;
      saveStats();
   }
   //Generate randomized mischief tasks for all regular crew members
   assignTasks() {
       for (const x in this.crew) {
         if (this.crew[x].displayName !== this.traitor.displayName) {
           const task = scenarios.mischiefTasks[getRandomInt(scenarios.mischiefTasks.length)];
           this.crew[x].send(`You are __not__ the traitor.\n` +
             `However... I do have a job for you: ${task.name}\n` +
             `**Your mission:** ${task.task}\n` +
             `**PS:** ${task.tip}`);
       }
     }
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
  getStatus() {
    let report = '';
    for (const t of this.tasks) {
      const status = t.complete ? PASS : FAIL;
      report = report.concat(status, ' - ', t.task, '\n');
    }
    return report;
  }
}

//Save updated stats to a file
function saveStats(){
  if (!logStatsEnabled) return;
  let data = JSON.stringify(stats, null, 2);
  fs.writeFile('stats.json', data, (err) => {
    if (err) console.log(err);
    console.log('Data written to file');
  });
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
