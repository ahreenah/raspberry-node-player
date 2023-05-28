console.log('loading libraries')
const fs = require('fs');
const FFplay = require('./ffplay-mod.js')
const mm = require('musicmetadata');
const rpio = require('rpio')
console.log('load completed')

rpio.open(15, rpio.INPUT, rpio.INPUT_PULLUP)
let softPoll = (pi, cbs)=>{
  let state = rpio.read(pi);
  let timeout = null;
  let enoughForShort = false;
  let efsTimeout = null;
  const check = ()=> {
    //console.log(rpio.read(pi));
    if(rpio.read(pi)==0){
      if(state == 1){
        cbs.up?.()
	if(enoughForShort){
          console.log('short')
	  cbs?.short?.();
	}
        clearTimeout(timeout);  
      }
    }
    if(rpio.read(pi)==1){
      if(state == 0){
        cbs.down?.()
        timeout = setTimeout(()=>{cbs.long?.(); enoughForShort = false}, 1000)
        efsTimeout = setTimeout(()=>{enoughForShort = true},300)
      }
    }
    state = rpio.read(pi)
    setTimeout(check, 10)
  }
  check();
}

let softPoll2 = (pi, cbs)=>{
  let state = rpio.read(pi);
  let count = 0;
  setInterval(()=>{
    //console.log('in:',rpio.read(pi));
    if(rpio.read(pi) == 1){
      count ++;
      //console.log('inc',count)
    } else {
      if(count)
      // console.log('ended', count);
      if(count >= 80) {
        //console.log('long');
        cbs?.long?.();
      } else if (count >= 6) {
        // console.log('short')
	cbs?.short?.();
      }
      count = 0;
    }
  },10)
}

softPoll2(15, {
  long:()=>{
    state?.player?.stop(); 
    console.log('long')
  },

  down:()=>{
    console.log('down')
  }, 
  up:()=>console.log('up'),
  short:()=>{
    console.log('short');
    state?.player?.stop();
    playFile(state.files, state.index+1)
  },
})


const musicFolder = '../Downloads'
rpio.open(5, rpio.INPUT)
rpio.poll(5, ()=>{
  console.log('next');
}, rpio.POLL_LOW);


let state = {
  name:'',
  meta:null,  
  player:null,
  index:null,
  files:[],
}

const display = ()=>{
  console.log('===================')
  console.log('====NOW PLAYING====')
  console.log(state.meta);
  if(state.meta){
    console.log(state.meta.artist||state.name);
    console.log(state.meta.title);
    console.log(state.meta.album);
  } else {
    console.log(state.name);
  }
}

fs.readdir(musicFolder, (err, files) => {  
  files.forEach(name => {
    console.log(name);
  });
  playFiles(files);
});

const playFile = async (files, index)=>{
  if(index>files.length-1){
    playFile(files,0);
    return;
  }
  console.log(`Playing index: `, index);
  state.meta = null;
  state.name = files[index];
  display();
  const parser = mm(fs.createReadStream(files[index]), (err, metadata) => {
    state.meta = metadata;
    display();
  });

  var player = new FFplay(files[index],{onTrackEnd:()=>{
	  console.log('track ended');
	  playFile(files, index+1)}
  })
  state.player = player;
  state.files = files;
  state.index = index;
}

const playFiles = (files) => {
  playFile(files.map(i=>`${musicFolder}/${i}`), 0)
}


