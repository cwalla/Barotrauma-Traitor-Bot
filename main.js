const Discord = require('discord.js');
const client = new Discord.Client();
//IMPORTANT: Comment out these two lines before Heroku deployment:
const auth = require('./token.json');
const token = auth.token;

const treachery = require('./scenarios.json');
let allSessions = new Map();

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
         return message.reply('You aren\'t in any voice channels!' )
       }
       const chanID = message.member.voice.channel.id;
       const crew = initCrew(message);
       const traitor = crew[getRandomInt(crew.length)];
       const mission = getRandomTask(treachery.scenarios);

       let session = new Session(crew, traitor, mission);
       allSessions.set(chanID, session);

       message.reply('There\'s a traitor in your midst...');
       traitor.send("You are the traitor.");
       traitor.send(`Commence operation: ${mission.name}`);
       traitor.send(`Your mission: ${mission.task}`);
       traitor.send(`PS: ${mission.tip}`);
     } catch (err) {
       message.channel.send("`Error: Can't do this in a DM channel.`");
       console.log(err);S
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
        return message.channel.send('"Hello, me...  Meet the *real* me!"\n' +
        '`Hint: Bots cannot be traitors.`');
      }
      if (!message.member.voice.channel) {
        return message.reply('You aren\'t in any voice channels!' );
      }
      const chanID = message.member.voice.channel.id;
      const traitor = member;
      const mission = getRandomTask(treachery.scenarios);

      let session = new Session([], traitor, mission);
      allSessions.set(chanID, session);

      traitor.send("You are the traitor.");
      traitor.send(`Commence operation: ${mission.name}`);
      traitor.send(`Your mission: ${mission.task}`);
      traitor.send(`PS: ${mission.tip}`);
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
       message.channel.send(`The traitor was ${session.traitor.displayName}!`);
       message.channel.send(`Their task was: ${session.mission.task}`);
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
       + '```'
     );
   }

   //Dump variables to console.  Deprecate after testing.
   if (message.content === '!dump') {
     console.log('Current Channel members:');
     console.log(initCrew(message));
     console.log('Current scenarios:');
     for (x in treachery.scenarios) {
       var t = treachery.scenarios[x].name;
       console.log(t);
     }
    }
 });

 class Session {
   constructor (crew, traitor, mission){
     this.crew = crew;
     this.traitor = traitor;
     this.mission = mission;
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
function getRandomTask(scenarios) {
  var task = scenarios[getRandomInt(scenarios.length)];
  return task;
}
