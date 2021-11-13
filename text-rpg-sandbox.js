/*
  orfeus-story-teller
  Sett Sarverott
  2019
*/
const readline=require('readline');
const fs=require('fs');
const child_process=require('child_process');
const path=require('path');

function debug(args){
  if(process.argv.length>2&&process.argv[2]=="debug"){
    console.log("\x1b[41m~")
    console.log(args);
    console.log("~\x1b[0m");
  }
}

var startDir=__dirname;
if(process.argv.length>2&&process.argv[2]=="change-library"){
  startDir=process.argv[3];
}

class Book{
  constructor(storyTeller){
    this.storyTeller=storyTeller;
    this.title="";
    this.description="";
    this.start="";
    this.end="";
    this.rooms={};

    //this.loadRooms(book.rooms);
    //this.bindOptionsWithRooms();
  }
  ending(){

  }
  beginStory(){
    if(!(process.argv.length>2&&process.argv[2]=="debug")){console.clear();}
    console.log("~ ~  "+this.title+"  ~ ~");
    console.info(this.description);
    var tmpThis=this;
    var answerTool=readline.createInterface({
      input:process.stdin,
      output:process.stdout
    });
    answerTool.question('# press enter...   ', function(answer){
      answerTool.close();
      tmpThis.rooms[tmpThis.start].printRoomInfo();
    });
  }
  bindOptionsWithRooms(){
    for(var i in this.rooms){
      for(var j in this.rooms[i].cacheOpt){
        var opt=this.rooms[this.rooms[i].cacheOpt[j]];
        if(opt===undefined) throw "MISSING ROOM SCENARIO: "+this.rooms[i].cacheOpt[j];
        this.rooms[i].options.push(opt);
      }
    }
  }
}

class Room{
  constructor(storyHook, tellerHook){
    this.teller=tellerHook;
    this.story=storyHook;
    this.name="";
    this.description="";
    this.cacheOpt=[];
    this.options=[];
  }
  printRoomInfo(){
    console.clear();
    console.log("\x1b[31m### "+this.name+" ###\x1b[0m");
    console.log(
      this.description.split("...").join("...\n\n")
    );
    console.log(" ");
    for(var i in this.options){
      console.log("# "+this.options[i].name);
    }
    if(this.options.length==0){
      console.log(" [THE END]");
      console.log(" ");
      console.log(" ");
      this.story.ending();
    }else{
      console.log(" ");
      this.printPrompt();
    }
  }
  printPrompt(){
    var tmpThis=this;
    var answerTool=readline.createInterface({
      input:process.stdin,
      output:process.stdout
    });
    answerTool.question('>~~~> ', function(answer){
      answerTool.close();
      tmpThis.chooseOption(answer);
    });
  }
  chooseOption(route){
    var choosen=null;
    for(var i in this.options){
      if(route.toLowerCase()==this.options[i].name.toLowerCase()){
        choosen=this.options[i];
      }
    }
    if(choosen===null){
      this.printRoomInfo();
    }else{
      choosen.printRoomInfo();
    }
  }
}

class StoryTeller{
  constructor(){
    this.story=null;
    this.checkAvaibleBooks();
  }
  checkAvaibleBooks(){
    var x=fs.readdirSync(startDir);
    for(var i in x){
      var y=x[i].split(".");
      if(y.pop()=="txt"){
        console.log(y.join("."));
      }
    }
    var tmpThis=this;
    var answerTool=readline.createInterface({
      input:process.stdin,
      output:process.stdout
    });
    answerTool.question('@ SELECT FILE >', function(answer){
      answerTool.close();
      if(x.includes(answer+".txt")){
        tmpThis.loadBook(answer+".txt");
        tmpThis.tell();
      }else{
        tmpThis.checkAvaibleBooks();
      }
    });
  }
  loadBook(bookPath){
    debug("LOADING BOOK");
    var story=new Book(this);
    this.story=story;
    debug(story);
    var flag=false;
    var roomId="";
    var room=null;
    var data=fs.readFileSync(path.join(startDir,bookPath)).toString().split("\n");
    for(var i in data){
      if(data[i].split("=").length>1){
        var tmp=data[i].split("=");
        var label=tmp.shift();
        var value=tmp.join("=");
        if(flag){
          if(room[label] instanceof Array){
            room[label].push(value.trim());
          }else{
            room[label]=value.trim();
          }
        }else{
          if(story[label] instanceof Array){
            story[label].push(value.trim());
          }else{
            story[label]=value.trim();
          }
        }
      }else if(data[i].substring(0,4)=="### "){
        if(flag&&data[i].substring(4,8)=="END "&&data[i].substring(8)==roomId){
          debug("NEW ROOM END");
          story.rooms[roomId.trim()]=room;
          room=null;
          flag=false;
          roomId="";
        }else if((!flag)&&data[i].substring(4,8)=="BEG "&&roomId==""){
          debug("NEW ROOM BEG");
          roomId=data[i].substring(8);
          room=new Room(story);
          flag=true;
        }else{
          throw "BAD WRITTEN SCENARIO-WRONG SYNTAX";
        }
      }
    }
    debug(this);
    debug("BINDING OPTIONS WITH ROOMS");
    this.story.bindOptionsWithRooms();
    debug(this);
  }
  tell(){
    this.story.beginStory();
  }
}

const homer=new StoryTeller();
