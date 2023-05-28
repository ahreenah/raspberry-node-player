const rpio = require('rpio')
rpio.open(5, rpio.INPUT)
rpio.poll(5, ()=>{
  console.log('next');
}, rpio.POLL_LOW);

