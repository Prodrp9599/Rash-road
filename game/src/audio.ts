export type GameAudio={
  start:()=>Promise<void>;
  update:(speedNorm:number,nitro:boolean,running:boolean)=>void;
  hit:(heavy?:boolean)=>void;
  nearMiss:()=>void;
  gameOver:()=>void;
};

export function createGameAudio():GameAudio{
  let ctx:AudioContext|undefined;
  let master:GainNode|undefined;
  let engineGain:GainNode|undefined;
  let engine:OscillatorNode|undefined;
  let engine2:OscillatorNode|undefined;
  let windGain:GainNode|undefined;
  let started=false;

  function tone(freq:number,duration:number,gain=.08,type:OscillatorType='sine',slideTo?:number){
    if(!ctx||!master||ctx.state!=='running')return;
    const o=ctx.createOscillator();
    const g=ctx.createGain();
    o.type=type;o.frequency.setValueAtTime(freq,ctx.currentTime);
    if(slideTo)o.frequency.exponentialRampToValueAtTime(Math.max(20,slideTo),ctx.currentTime+duration);
    g.gain.setValueAtTime(gain,ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+duration);
    o.connect(g);g.connect(master);o.start();o.stop(ctx.currentTime+duration+.02);
  }

  async function start(){
    if(!ctx){
      ctx=new AudioContext();
      master=ctx.createGain();master.gain.value=.34;master.connect(ctx.destination);

      engineGain=ctx.createGain();engineGain.gain.value=0;engineGain.connect(master);
      engine=ctx.createOscillator();engine.type='sawtooth';engine.frequency.value=70;engine.connect(engineGain);engine.start();
      engine2=ctx.createOscillator();engine2.type='square';engine2.frequency.value=35;const e2g=ctx.createGain();e2g.gain.value=.12;engine2.connect(e2g);e2g.connect(engineGain);engine2.start();

      const buffer=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate);
      const data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*.45;
      const noise=ctx.createBufferSource();noise.buffer=buffer;noise.loop=true;
      const filter=ctx.createBiquadFilter();filter.type='bandpass';filter.frequency.value=900;filter.Q.value=.45;
      windGain=ctx.createGain();windGain.gain.value=0;
      noise.connect(filter);filter.connect(windGain);windGain.connect(master);noise.start();
    }
    if(ctx.state!=='running')await ctx.resume();
    started=true;
    tone(420,.12,.045,'triangle',620);
  }

  function update(speedNorm:number,nitro:boolean,running:boolean){
    if(!ctx||!engine||!engine2||!engineGain||!windGain||!started)return;
    const active=running?1:0;
    const now=ctx.currentTime;
    const rpm=68+speedNorm*125+(nitro?35:0);
    engine.frequency.setTargetAtTime(rpm,now,.045);
    engine2.frequency.setTargetAtTime(rpm*.51,now,.055);
    engineGain.gain.setTargetAtTime(active*(.022+speedNorm*.038+(nitro?.018:0)),now,.08);
    windGain.gain.setTargetAtTime(active*(.004+speedNorm*.05+(nitro?.018:0)),now,.12);
  }

  return {
    start,
    update,
    hit:(heavy=false)=>{tone(heavy?90:135,heavy?.28:.18,heavy?.15:.10,'sawtooth',55);tone(heavy?55:78,.22,.06,'square',40)},
    nearMiss:()=>{tone(610,.13,.045,'triangle',980);setTimeout(()=>tone(880,.11,.032,'triangle',1180),55)},
    gameOver:()=>{tone(210,.22,.075,'sawtooth',130);setTimeout(()=>tone(125,.35,.08,'triangle',72),120)},
  };
}
