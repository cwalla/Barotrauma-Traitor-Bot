const Discord = require('discord.js');
const client = new Discord.Client();
//IMPORTANT: Comment out these two lines before Heroku deployment:
const auth = require('./token.json');
const token = auth.token;

const treachery = require('./scenarios.json');
var traitor = '';

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
     if (!message.member.voice.channel) {
       return message.reply('You aren\'t in any voice channels!' )
     }
     const crew = init(message);
     traitor = crew[getRandomInt(crew.length)];
     message.reply('There\'s a traitor in your midst...');
     traitor.send("You are the traitor.");

     const orders = getRandomTask(treachery.scenarios);
     traitor.send(`Commence operation: ${orders.name}`);
     traitor.send(`Your mission: ${orders.task}`);
     console.log(traitor.displayName);
   }

   //Set a specific player as the traitor
   if (message.content.startsWith("!settraitor")) {
     const member = message.mentions.members.first();
     if (!member) {
      return message.reply(
        'Specified user is not a member of the server.  Syntax:\n' +
        '`!settraitor @<userName>`'
      );
    }
    //Ensure traitor is not a bot
    if (member.user.bot) {
      message.channel.send('"Hello, me...  Meet the *real* me!"');
      message.channel.send('`Hint: Bots cannot be traitors.`');
      return;
    }
     traitor = member;
     message.channel.send(`Set ${traitor.displayName} as the traitor.`);
     member.send("You are the traitor.");
     const orders = getRandomTask(treachery.scenarios);
     traitor.send(`Commence operation: ${orders.name}`);
     traitor.send(`Your mission: ${orders.task}`);
   }

   //Reveal who the traitor was
   if (message.content === '!reveal') {
     //Unless traitor is not set, traitor should be an Object and not a String
     if (typeof traitor === 'string') {
       message.channel.send('Nobody is the traitor...\n\nYet...');
       return;
     }
     message.channel.send(`The traitor was ${traitor.displayName}!`);
   }

   //Clear all traitors
   if (message.content === '!clear') {
     traitor = "Nobody";
     message.channel.send('Traitors have been cleared.');
   }

    //Initialize traitor array
   if (message.content === '!init'){
      if (!message.member.voice.channel) {
        return message.reply('You aren\'t in any voice channels!' )
      }
      init(message);
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
     console.log('Is Traitor set?');
     console.log(traitorSet);
     console.log('Should be value of traitor:');
     console.log(traitor);
     console.log('Current Channel members:');
     console.log(init(message));
     console.log('Current scenarios:');
     for (x in treachery.scenarios) {
       var t = treachery.scenarios[x].name;
       console.log(t);
     }
     console.log('A randomly selected task:');
     var task = getRandomTask(treachery.scenarios);
     console.log(task);
    }
 });

//Generate an integer between 0 and max, exclusive of max
 function getRandomInt(max) {
   return Math.floor(Math.random() * Math.floor(max));
 }

 //Returns an array of voice channel members
function init(message){
  var chanUsers = [];
  const vChan = message.member.voice.channel;
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
