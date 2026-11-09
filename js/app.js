const $=s=>document.querySelector(s);
const M=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const S={photos:[],cur:0,shot:null,pan:{x:0,y:0},ll:[-1.72448,114.83043],t:0,tok:0};
const mapC=document.createElement('canvas');mapC.width=mapC.height=512;
const mc=mapC.getContext('2d');
const pad=n=>String(n).padStart(2,'0');
const keys=[...document.querySelectorAll('[data-k]')];
const NOSAVE=['tn','tl'];

/* ---- settings ---- */
try{const c=JSON.parse(localStorage.gs_cfg||'{}');keys.forEach(e=>{if(e.id in c)e.type==='checkbox'?e.checked=c[e.id]:e.value=c[e.id]})}catch{}
{const d=new Date(),f=`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
$('#tn').value=f;$('#tl').value=f}
function save(){const c={};keys.forEach(e=>{if(!NOSAVE.includes(e.id))c[e.id]=e.type==='checkbox'?e.checked:e.value});try{localStorage.gs_cfg=JSON.stringify(c)}catch{}}

/* ---- coordinates ---- */
function dms(v,pos,neg){const a=Math.abs(v);let d=Math.floor(a),m=Math.floor((a-d)*60),s=((a-d)*60-m)*60;
 if(s.toFixed(3)==='60.000'){s=0;m++}if(m===60){m=0;d++}
 return `${v<0?'-':''}${d}°${m}′${s.toFixed(3)}″ ${v<0?neg:pos}`}
function parse(t){const h=t.split(/\s*[,;]\s*/).filter(Boolean);if(h.length!==2)return null;
 const v=h.map(x=>{const n=x.match(/\d+(?:\.\d+)?/g);if(!n)return NaN;const a=+n[0]+(+n[1]||0)/60+(+n[2]||0)/3600;return /-|[SW]/i.test(x)?-a:a});
 return v.some(isNaN)||Math.abs(v[0])>90||Math.abs(v[1])>180?null:v}
const dmsLine=()=>`${dms(S.ll[0],'N','S')}, ${dms(S.ll[1],'E','W')}`;

/* ---- text ---- */
function tstr(id,i){const v=$(id).value;if(!v)return '';const d=new Date(v);d.setMinutes(d.getMinutes()+i*(+$('#inc').value||0));
 return `${pad(d.getDate())} ${M[d.getMonth()]} ${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} GMT${$('#tz').value}`}
function lines(i){return [`Network: ${tstr('#tn',i)}`,`Local: ${tstr($('#same').checked?'#tn':'#tl',i)}`,dmsLine(),...$('#addr').value.split('\n').map(x=>x.trim()).filter(Boolean)]}

/* ---- map ---- */
function pin(){if(!$('#pin').checked)return;mc.fillStyle='#e04b3f';mc.beginPath();mc.arc(256,222,24,Math.PI*.8,Math.PI*.2,false);mc.lineTo(256,264);mc.closePath();mc.fill();mc.fillStyle='#fff';mc.beginPath();mc.arc(256,222,9,0,7);mc.fill()}
function drawShot(){mc.fillStyle='#cfd6d2';mc.fillRect(0,0,512,512);const i=S.shot;
 if(i){const k=512/Math.min(i.width,i.height)*(+$('#zs').value),w=i.width*k,h=i.height*k;mc.drawImage(i,256-w/2+S.pan.x,256-h/2+S.pan.y,w,h)}pin()}
async function drawOSM(){const tok=++S.tok,[lat,lon]=S.ll,z=+$('#zo').value,n=2**z,r=lat*Math.PI/180;
 const fx=(lon+180)/360*n,fy=(1-Math.log(Math.tan(r)+1/Math.cos(r))/Math.PI)/2*n,tx=Math.floor(fx),ty=Math.floor(fy);
 const cv=document.createElement('canvas');cv.width=cv.height=768;const c=cv.getContext('2d');
 await Promise.all([-1,0,1].flatMap(dy=>[-1,0,1].map(dx=>new Promise(res=>{const im=new Image();im.crossOrigin='anonymous';
  im.onload=()=>{c.drawImage(im,(dx+1)*256,(dy+1)*256);res()};im.onerror=res;im.src=`https://tile.openstreetmap.org/${z}/${tx+dx}/${ty+dy}.png`}))));
 if(tok!==S.tok)return;
 const cx=(fx-tx+1)*256,cy=(fy-ty+1)*256;mc.drawImage(cv,cx-256,cy-256,512,512,0,0,512,512);
 mc.font='bold 14px sans-serif';mc.fillStyle='rgba(255,255,255,.8)';mc.fillRect(332,490,180,22);mc.fillStyle='#333';mc.fillText('© OpenStreetMap',340,506);
 pin();render()}
function map(){const m=$('#mmode').value;if(m==='shot')drawShot();else if(m==='osm'){clearTimeout(S.t);S.t=setTimeout(drawOSM,350)}render()}

/* ---- render ---- */
function stamp(c,w,h,i){const s=Math.max(w,h)/2592,fs=60*s*(+$('#tsize').value/100),lh=fs*1.18,L=lines(i);
 if($('#mmode').value!=='none'){const z=574*s*(+$('#msize').value/100);c.save();c.globalAlpha=+$('#mopa').value/100;c.drawImage(mapC,61*s,h-63*s-z,z,z);c.restore()}
 c.save();c.globalAlpha=+$('#topa').value/100;c.fillStyle='#fff';c.textAlign='right';c.font=`${fs}px "Segoe UI",Tahoma,Roboto,sans-serif`;
 c.shadowColor='rgba(0,0,0,.75)';c.shadowBlur=4*s;c.shadowOffsetX=c.shadowOffsetY=2*s;
 L.forEach((t,k)=>c.fillText(t,w-90*s,h-48*s-(L.length-1-k)*lh));c.restore()}
function render(){const p=S.photos[S.cur],cv=$('#stage'),w=p?p.width:2592,h=p?p.height:1944;cv.width=w;cv.height=h;
 const c=cv.getContext('2d');if(p)c.drawImage(p,0,0);else{c.fillStyle='#6f7e7a';c.fillRect(0,0,w,h)}
 stamp(c,w,h,S.cur);$('#hint').hidden=!!p;const v=$('#mapView');v.getContext('2d').drawImage(mapC,0,0,v.width,v.height)}
function upd(){const ll=parse($('#coord').value);if(ll)S.ll=ll;
 $('#dmsOut').textContent=ll?dmsLine():'Format koordinat tidak dikenali';$('#tl').disabled=$('#same').checked;
 $('#shotBox').hidden=$('#mmode').value!=='shot';$('#osmBox').hidden=$('#mmode').value!=='osm';save();map()}
keys.forEach(e=>e.addEventListener('input',upd));

/* ---- photos ---- */
function thumbs(){const t=$('#thumbs');t.innerHTML='';S.photos.forEach((p,i)=>{const b=document.createElement('button');b.type='button';b.className='th'+(i===S.cur?' on':'');
 b.innerHTML=`<img src="${p.url}" alt="Foto ${i+1}">`;b.onclick=()=>{S.cur=i;thumbs();render()};t.append(b)})}
async function addFiles(fl){const start=S.photos.length;
 for(const f of fl){if(!f.type.startsWith('image/'))continue;const b=await createImageBitmap(f,{imageOrientation:'from-image'});b.fname=f.name.replace(/\.[^.]+$/,'');b.url=URL.createObjectURL(f);S.photos.push(b)}
 if(S.photos.length>start)S.cur=start;thumbs();render()}
const dz=$('#drop');
dz.onclick=()=>$('#files').click();dz.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();$('#files').click()}};
dz.ondragover=e=>{e.preventDefault();dz.classList.add('over')};dz.ondragleave=()=>dz.classList.remove('over');
dz.ondrop=e=>{e.preventDefault();dz.classList.remove('over');addFiles(e.dataTransfer.files)};
$('#files').onchange=e=>{addFiles(e.target.files);e.target.value=''};
$('#del').onclick=()=>{if(!S.photos.length)return;URL.revokeObjectURL(S.photos[S.cur].url);S.photos.splice(S.cur,1);S.cur=Math.max(0,S.cur-1);thumbs();render()};

/* ---- screenshot crop ---- */
function loadShot(f){createImageBitmap(f).then(b=>{S.shot=b;S.pan={x:0,y:0};drawShot();render()})}
$('#shotFile').onchange=e=>e.target.files[0]&&loadShot(e.target.files[0]);
document.addEventListener('paste',e=>{const f=[...(e.clipboardData?.files||[])].find(f=>f.type.startsWith('image/'));if(f&&$('#mmode').value==='shot')loadShot(f)});
{const mv=$('#mapView');let d=null;
 mv.onpointerdown=e=>{if($('#mmode').value!=='shot')return;d=[e.clientX,e.clientY];mv.setPointerCapture(e.pointerId)};
 mv.onpointermove=e=>{if(!d)return;const k=512/mv.getBoundingClientRect().width;S.pan.x+=(e.clientX-d[0])*k;S.pan.y+=(e.clientY-d[1])*k;d=[e.clientX,e.clientY];drawShot();render()};
 mv.onpointerup=()=>d=null}

/* ---- presets ---- */
const P=()=>{try{return JSON.parse(localStorage.gs_pre||'{}')}catch{return{}}};
function presets(){const s=$('#preset');s.innerHTML='';s.add(new Option('Pilih preset…',''));Object.keys(P()).forEach(k=>s.add(new Option(k,k)))}
$('#preset').onchange=e=>{const p=P()[e.target.value];if(!p)return;$('#coord').value=p.coord;$('#addr').value=p.addr;$('#tz').value=p.tz;upd()};
$('#psave').onclick=()=>{const n=prompt('Nama preset:');if(!n)return;const p=P();p[n]={coord:$('#coord').value,addr:$('#addr').value,tz:$('#tz').value};localStorage.gs_pre=JSON.stringify(p);presets();$('#preset').value=n};
$('#pdel').onclick=()=>{const n=$('#preset').value;if(!n)return;const p=P();delete p[n];localStorage.gs_pre=JSON.stringify(p);presets()};

/* ---- reverse geocode (Nominatim) ---- */
$('#geo').onclick=async()=>{const [la,lo]=S.ll;try{
 const r=await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=18&accept-language=id&lat=${la}&lon=${lo}`);const a=(await r.json()).address||{};
 $('#addr').value=[a.road&&(/^(jl|jalan)/i.test(a.road)?a.road:'Jalan '+a.road),a.village||a.suburb||a.neighbourhood,a.city_district||a.municipality,a.county||a.city,a.state].filter(Boolean).join('\n');upd()
}catch{alert('Gagal mengambil alamat. Cek koneksi internet, lalu isi manual jika perlu.')}};

/* ---- export ---- */
async function exportOne(i){const p=S.photos[i];if(!p)return;const cv=document.createElement('canvas');cv.width=p.width;cv.height=p.height;
 const c=cv.getContext('2d');c.drawImage(p,0,0);stamp(c,cv.width,cv.height,i);
 const blob=await new Promise(r=>cv.toBlob(r,'image/jpeg',+$('#q').value));
 const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=$('#fname').value.replace('{n}',pad(i+1)).replace('{name}',p.fname)+'.jpg';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),3000)}
$('#expOne').onclick=()=>exportOne(S.cur);
$('#expAll').onclick=async()=>{for(let i=0;i<S.photos.length;i++){await exportOne(i);await new Promise(r=>setTimeout(r,400))}};

presets();upd();
