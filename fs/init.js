load('api_config.js');
load('api_events.js');
load('api_gpio.js');
load('api_mqtt.js');
load('api_net.js');
load('api_sys.js');
load('api_timer.js');
load('api_rpc.js');

//Get config
let led = Cfg.get('smarthome.led');
let button = Cfg.get('smarthome.button');
let mqttPrefix = Cfg.get('smarthome.mqttPrefix');
let mqttTopicState = mqttPrefix + '/state';
let mqttTopicPresence = mqttPrefix + '/presence';

//In-/output config
GPIO.set_mode(led, GPIO.MODE_OUTPUT);
GPIO.set_mode(button, GPIO.MODE_INPUT);
GPIO.set_pull(button, GPIO.PULL_UP);
GPIO.set_pull(led, GPIO.PULL_DOWN);

//Init state var
let state = null;

//Set handler on any edge and publish ON or OFF
GPIO.set_int_handler(button, GPIO.INT_EDGE_ANY, function(){
  let stateNow = (GPIO.read(button)) ? 0 : 1;
  if(state !== stateNow){
    state = stateNow;
    GPIO.write(led, 0);
    GPIO.disable_int(button);
    if(MQTT.pub(mqttTopicState, (state) ? 'ON' : 'OFF')){
      Timer.set(50, 0, function(){
        GPIO.write(led, 1);
        GPIO.enable_int(button);
      }, null);
    }
  }
}, function(){});

GPIO.enable_int(button);

//Publish system info each minute
Timer.set(60000, Timer.REPEAT, function() {
  RPC.call(RPC.LOCAL, 'Sys.GetInfo', null, function(resp, ud) {
    MQTT.pub(mqttTopicPresence, JSON.stringify(resp));
  }, null);
}, null);
