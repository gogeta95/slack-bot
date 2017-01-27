var slack = require('slack')
var chalk = require('chalk')
var WebClient = require('@slack/client').WebClient;

var bot = slack.rtm.client()
var token = process.env.SLACK_API_TOKEN
var web = new WebClient(token);
//Stores current logged in user id.
var userId;
//Stores list of emojis
var emojis=[];

//checks if a given message is DM or not.
var isDM = function(message){
  return message.channel[0]==='D';
}

//Saves all emojis present at bot startup.
var saveEmojis =function () {
  web.emoji.list((err,data)=>{
    if (err) {
      console.log(chalk.red("Error getting Emojis!!  "+JSON.stringify(err)));
    }
    else {
      for(var emoji in data.emoji){
        emojis.push(emoji);
      }
    }
  });
}

var getRandomEmoji =function () {
  return emojis[Math.floor(Math.random() * emojis.length)];
}
//Listens to all message events.
bot.message(function(message) {
  console.log('Got a message:',message)
  if (isDM(message)) {
    addReaction(getRandomEmoji(),message.channel,message.ts);
  }
  if (userId==message.user) {
    //Skip if my message.
    console.log(chalk.red("My message, ignored."));
    return;
  }
  if (!isDM(message)) {
    console.log(chalk.red("Not a DM, ignored."));
    return;
  }
    sendmsg(message.channel,"BOT message")
});

//Detects if server is going to end connection soon.
bot.goodbye(function(data){
console.log(chalk.red('goodbye!! '+chalk.red(JSON.stringify(data))));
});

//Bot started.
bot.started((data)=>{
    console.log(chalk.green("Bot Started."));
});

//The client has successfully connected to the server.
bot.hello(message=> {
  console.log(chalk.white.bgGreen("Bot has successfully connected to the server."));
  saveEmojis();
})

//Sends a message after checking if the user is online via another client or not.
var sendmsg =function(channel,text) {
    checkPresence(userId,(ispresent)=>{
      if (!ispresent) {
        console.log(chalk.green('Sending: '+text));
        web.chat.meMessage(channel,text,
          (err, data) => {
            if (err) {
             console.log('Error:', err);
           } else {
             console.log(chalk.green('Sent'),chalk.green(JSON.stringify(data)));
         }
      });
      }
      else {
        console.log(chalk.orange("User was present via another client, skipping message."));
      }
    });
}
var addReaction= function (name,channel,timestamp) {
    web.reactions.add(name,{channel,timestamp}, (err, data) => {
      if (err) {
        console.log(chalk.red('Error Adding Reaction!'+ JSON.stringify(err)));
      }
      else{
        console.log(chalk.green('Added Reaction!'+ JSON.stringify(data)));
      }
    })
}
//Checks if user is online via another client.
var checkPresence=function(user,callback) {
  web.users.getPresence(user,(err,data)=>{
    if (err) {
      console.log(err);
    }
    else {
      if (data.connection_count<=1) {
        callback(false);
      }
      else {
        callback(true);
      }
    }
  });
}
//Saves the Current user id and starts the bot.
var saveCurrentUserIdAndStartBot = function() {
  web.auth.test((err,data) =>{
    if (err) {
      console.log(chalk.red("Error! Exiting!\n"),err);
    }
    else {
      userId = data.user_id;
      console.log("Current User ID: "+userId);
      bot.listen({token});
    }
  });
}

saveCurrentUserIdAndStartBot();
