var slack = require('slack')
var chalk = require('chalk')

var bot = slack.rtm.client()
var token = process.env.SLACK_API_TOKEN
//Stores current logged in user id.
var userId;

//checks if a given message is DM or not.
var isDM = function(message){
  return message.channel[0]==='D';
}
//Listens to all message events.
bot.message(function(message) {
  console.log('Got a message:',message)
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
})

//Sends a message after checking if the user is online via another client or not.
var sendmsg =function(channel,text) {
    checkPresence(userId,(ispresent)=>{
      if (!ispresent) {
        console.log(chalk.green('Sending: '+text));
        slack.chat.meMessage({token,channel,text},
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

//Checks if user is online via another client.
var checkPresence=function(user,callback) {
  slack.users.getPresence({token,user},(err,data)=>{
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
  slack.auth.test({token},(err,data) =>{
    if (err) {
      console.log(chalk.red("Error! Exiting!\n"),err);
    }
    else {
      userId = data.user_id;
      console.log("Current User ID: "+userId);
      bot.listen({token});
      console.log("Bot is now listening");
    }
  });
}

saveCurrentUserIdAndStartBot();
