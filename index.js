const Promise = require('bluebird');
var slack = Promise.promisifyAll(require('slack'));
var chalk = require('chalk')
var WebClient = require('@slack/client').WebClient;

var bot = slack.rtm.client()
var token = process.env.SLACK_API_TOKEN
// var token= '5353545353534';
var web = new WebClient(token);
Promise.promisifyAll(web.channels);
Promise.promisifyAll(web.emoji);
Promise.promisifyAll(web.chat);
Promise.promisifyAll(web.users);
Promise.promisifyAll(web.auth);
Promise.promisifyAll(web.reactions);
Promise.promisifyAll(bot);
function CustomError(message) {
    this.name = "CustomError";
    this.message = (message || "");
}
CustomError.prototype = Error.prototype;
//Stores current logged in user id.
var userId;
//Stores list of emojis
var emojis=[];

//checks if a given message is DM or not.
var isDM = function(message){
  return message.channel[0]==='D';
}

var getChannels = function () {
  web.channels.listAsync().then(
    (data) => {console.log(data);},
    (err) => {
      console.log(chalk.red('Error getting channels!!!'))
      console.log(err);}
  );
}

//Saves all emojis present at bot startup.
var saveEmojis =function () {
  return web.emoji.listAsync().then(
    (data) => {
      for(var emoji in data.emoji){
        emojis.push(emoji);
      }
    }
  ).error(
    (err) => {console.log(chalk.red("Error getting Emojis!!  "+JSON.stringify(err)));}
  );
}

var getRandomEmoji =function () {
  return emojis[Math.floor(Math.random() * emojis.length)];
}
//Listens to all message events.
bot.message(
  (message) => {
  console.log('Got a message:',message)
  if (isDM(message)) {
    addReaction(getRandomEmoji(),message.channel,message.ts);
  }
  // if (userId==message.user) {
  //   //Skip if my message.
  //   console.log(chalk.red("My message, ignored."));
  //   return;
  // }
  if (!isDM(message)) {
    console.log(chalk.red("Not a DM, ignored."));
    return;
  }
    sendmsg(message.channel,"BOT message")
}
);

//Detects if server is going to end connection soon.
bot.goodbyeAsync().then(
  (data) => {console.log(chalk.red('goodbye!! '+chalk.red(JSON.stringify(data))));}
);

//Bot started.
bot.started(
  (data)=>{console.log(chalk.green("Bot Started."));}
);

//The client has successfully connected to the server.
bot.hello(
  (message)=> {
    console.log(chalk.white.bgGreen("Bot has successfully connected to the server."));
    saveEmojis();
    getChannels();
  }
);

//Sends a message after checking if the user is online via another client or not.
var sendmsg =function(channel,text) {
  return  checkPresence(userId).then(
      () => {
          console.log(chalk.green('Sending: '+text));
          web.chat.meMessageAsync(channel,text).then(
            (data) =>{
              console.log(chalk.green('Sent'),chalk.green(JSON.stringify(data)));
            }
          ).error(
            (err) =>{
              console.log('Error:', err);
            }
          );
        }
    ).error(
      (err) => {
        if (err===true) {
           console.log(chalk.orange("User was present via another client, skipping message."));
        }
        else{
        console.log(err);
        }
        return err;
      }
    );
}
var addReaction= function (name,channel,timestamp) {
  return  web.reactions.addAsync(name,{channel,timestamp}).then(
      (data) => {
        console.log(chalk.green('Added Reaction!'+ JSON.stringify(data)));
        return data;
      }
    ).error(
      (err) => {
        console.log(chalk.red('Error Adding Reaction!'+ JSON.stringify(err)));
        return err;
      }
    );
}
//Checks if user is online via another client.
var checkPresence=function(user) {
  return web.users.getPresenceAsync(user).then(
    (data) => {
      if(data.connection_count>1){
        console.log("Returned error");
        throw new CustomError("user was present");
        // return false;
      }
    }
  )
  .error(
    (err) => {
      console.log(err);
      return err;
    }
  );
}
//Saves the Current user id and starts the bot.
var saveCurrentUserIdAndStartBot = function() {
  web.auth.testAsync().then(
    (data)=>{
        userId = data.user_id;
        console.log("Current User ID: "+userId);
        bot.listen({token});
    }
  ).error(
    (error) => {
      console.log(chalk.red("Error! Exiting!\n"),error);
    }
  )
}

saveCurrentUserIdAndStartBot();
