/* ===================== DATA ===================== */
let FARMERS = [
  {id:'ngassa', name:'Farmer Ngassa', location:'West Region', bio:"Growing tomatoes and vegetables for three generations, now selling straight to buyers across Yaoundé.", verified:true, avatar:null},
  {id:'ateba', name:'Farmer Ateba', location:'Yaoundé outskirts', bio:'Specializes in onions and root vegetables, supplying restaurants and households.', verified:true, avatar:null},
  {id:'mballa', name:'Farmer Mballa', location:'Douala region', bio:"Plantain grower supplying Douala's central market for over a decade.", verified:true, avatar:null},
  {id:'nkolbisson', name:'Nkolbisson Cooperative', location:'Nkolbisson', bio:'A farming cooperative of 40+ smallholder maize growers.', verified:true, avatar:null},
  {id:'fongoh', name:'Farmer Fongoh', location:'North West Highlands', bio:'New to Theraprice — currently completing identity verification.', verified:false, avatar:null},
  {id:'belinga', name:'Farmer Belinga', location:'West Region', bio:'Garlic and spice grower, cures produce for extended shelf life.', verified:true, avatar:null},
  {id:'ngobella', name:'Farmer Ngo Bella', location:'Bafoussam', bio:'Bean farmer known for consistent, high-quality harvests.', verified:true, avatar:null},
  {id:'eyenga', name:'Farmer Eyenga', location:'Centre Region', bio:'Cassava farmer delivering fresh-uprooted bundles weekly.', verified:true, avatar:null}
];

let PRODUCTS = [
  {id:1,name:'Tomatoes',category:'Vegetables',color:'#F4D9CE',image:null,price:450,unit:'basket',farmerId:'ngassa',status:'live',trend:'down',prob:78,tier:'high',range:[380,420],mid:400,
    desc:'Fresh, vine-ripened tomatoes from the West region, harvested within 48 hours. Sold by the standard market basket.',
    why:{supply:'+42% listings vs 4-week average',season:'Peak tomato harvest period',weather:'Favorable growing conditions, especially from the West',demand:'Holding steady'}},
  {id:2,name:'Garlic',category:'Vegetables',color:'#F5EEE1',image:null,price:1800,unit:'kg',farmerId:'belinga',status:'live',trend:'up',prob:81,tier:'high',range:[1650,1950],mid:1800,
    desc:'Cured garlic bulbs from the West region, dried for extended shelf life and a stronger flavor. Sold by the kilogram.',
    why:{supply:'-15% listings vs 4-week average',season:'Tail end of the garlic curing season',weather:'Dry spell aiding curing quality',demand:'Rising ahead of the festive cooking season'}},
  {id:3,name:'Onions',category:'Vegetables',color:'#F0E1C7',image:null,price:375,unit:'kg',farmerId:'ateba',status:'live',trend:'down',prob:66,tier:'medium',range:[340,410],mid:375,
    desc:"Fresh red onions from Yaoundé's outskirts, sold loose by the kilogram.",
    why:{supply:'+28% listings vs 4-week average',season:'Peak onion harvest',weather:'Favorable dry conditions supporting storage crops',demand:'Steady household demand'}},
  {id:4,name:'Okro',category:'Vegetables',color:'#DCEBC7',image:null,price:300,unit:'basket',farmerId:'ngobella',status:'live',trend:'flat',prob:54,tier:'medium',range:[270,330],mid:300,
    desc:'Tender fresh okra pods, sold by the standard market basket.',
    why:{supply:'Holding steady vs 4-week average',season:'Mid okra season',weather:'Normal rainfall for the region',demand:'Consistent demand from local markets'}},
  {id:5,name:'Plantains',category:'Plantains & Tubers',color:'#EFE0A8',image:null,price:1500,unit:'bunch',farmerId:'mballa',status:'live',trend:'up',prob:74,tier:'high',range:[1350,1650],mid:1500,
    desc:"Ripe plantain bunches from Douala's central market growers, harvested this week.",
    why:{supply:'-10% listings vs 4-week average',season:'Between harvest cycles',weather:'Recent rains slowing transport from farms',demand:'Rising demand from urban markets'}},
  {id:6,name:'Cocoyams',category:'Plantains & Tubers',color:'#E3D4C0',image:null,price:2600,unit:'bag',farmerId:'eyenga',status:'live',trend:'flat',prob:47,tier:'low',range:[2400,2800],mid:2600,
    desc:'Fresh-uprooted cocoyam tubers from the Centre Region, sold by the standard 25kg bag.',
    why:{supply:'Thin listing history for this crop',season:'Early cocoyam season',weather:'Typical conditions for the region',demand:'Limited data on recent demand shifts'}}
];
const CATEGORIES = [...new Set(PRODUCTS.map(p=>p.category))];
const PLATFORM_COMMISSION_RATE = 0.10;
let SALES = [];
let REVIEWS = [
  {id:1, farmerId:'ngassa', authorId:'aisha', author:'Aisha B.', stars:5, text:'Tomatoes were fresh and the delivery was right on time. Will order again.', time:'2 weeks ago'},
  {id:2, farmerId:'ngassa', authorId:'paul', author:'Paul E.', stars:4, text:'Good quality, a couple were a bit soft but overall a fair basket.', time:'1 month ago'}
];
let PRODUCT_REVIEWS = [
  {id:1, productId:1, authorId:'aisha', author:'Aisha B.', stars:5, text:'Always fresh on delivery — ordered twice now, both times the produce looked exactly like the listing photos.', time:'this month'},
  {id:2, productId:1, authorId:'paul', author:'Paul E.', stars:5, text:'Fair pricing — cheaper than what I was paying at the local market, and I can see the price trend before I buy.', time:'this month'},
  {id:3, productId:1, authorId:'grace', author:'Grace M.', stars:4, text:"Good communication — seller responded quickly when I asked about delivery timing.", time:'this month'}
];

let MOMENTS = [
  {id:1, farmerId:'ngassa', text:'Harvest ready this week — fresh tomatoes coming off the vine in the West region.', image:null, time:'2 days ago', likes:6, likedByMe:false,
    comments:[
      {id:101, author:'Aisha B.', authorId:'aisha', text:"Great, I'll order a basket today!", time:'1 day ago', likes:2, likedByMe:false, replies:[]},
      {id:102, author:'Paul E.', authorId:'paul', text:'Are you delivering to Douala this week?', time:'20 hours ago', likes:0, likedByMe:false, replies:[
        {id:1021, author:'Ngassa Farms', authorId:'ngassa', text:'Yes, Thursday delivery run to Douala.', time:'18 hours ago', likes:1, likedByMe:false, replies:[]}
      ]}
    ]},
  {id:2, farmerId:'nkolbisson', text:'Rain finally let up — maize drying faster now. Expect more listings by Friday.', image:null, time:'6 days ago', likes:3, likedByMe:false,
    comments:[{id:201, author:'Grace M.', authorId:'grace', text:'Looking forward to it, need 3 bags for my shop.', time:'5 days ago', likes:1, likedByMe:false, replies:[]}]},
  {id:3, farmerId:'belinga', text:'New batch of garlic just cured and ready to list — smaller heads than usual but stronger flavor.', image:null, time:'1 week ago', likes:0, likedByMe:false, comments:[]}
];

/* ===================== STATE ===================== */
/* ===================== I18N (EN / FR) ===================== */
const I18N = {
  nav_home:{en:'Home', fr:'Accueil'},
  nav_market:{en:'Marketplace', fr:'Marché'},
  nav_social:{en:'Social', fr:'Social'},
  nav_about:{en:'About Us', fr:'À propos'},
  hero_pill:{en:'📈 Powered price predictions', fr:'📈 Prédictions de prix'},
  hero_h1:{en:"Know tomorrow's <em>crop prices</em>, today.", fr:"Connaissez les <em>prix de demain</em>, dès aujourd'hui."},
  hero_lead:{en:"Theraprice connects Cameroon's farmers and buyers directly — with live market prices, smart drop and rise predictions, and a trust-verified marketplace, all in one place.", fr:"Theraprice connecte directement les agriculteurs et acheteurs du Cameroun — prix du marché en direct, prédictions intelligentes de hausse et de baisse, et une place de marché vérifiée, le tout au même endroit."},
  hero_cta1:{en:'Get Started Free', fr:'Commencer gratuitement'},
  hero_cta2:{en:'See How It Works', fr:'Voir comment ça marche'},
  hero_meta:{en:'Free for farmers · FR / EN', fr:'Gratuit pour les agriculteurs · FR / EN'},
  auth_login:{en:'Log In', fr:'Connexion'},
  auth_getstarted:{en:'Get Started', fr:"S'inscrire"},
  auth_logout:{en:'Log out', fr:'Déconnexion'},
  dash_greeting:{en:'Welcome back', fr:'Content de vous revoir'},
  dash_sub_farmer:{en:"Here's how your listings and the market are doing today.", fr:"Voici comment vos annonces et le marché se portent aujourd'hui."},
  dash_sub_buyer:{en:"Here's what's moving in the market today.", fr:"Voici ce qui bouge sur le marché aujourd'hui."},
  qa_listings:{en:'My Listings', fr:'Mes annonces'},
  qa_listings_sub:{en:'Manage produce for sale', fr:'Gérer vos produits en vente'},
  qa_moment:{en:'Post a Moment', fr:'Publier un Moment'},
  qa_moment_sub:{en:'Share a farm update', fr:'Partager une actualité'},
  qa_buy:{en:'Buy Produce', fr:'Acheter des produits'},
  qa_buy_sub:{en:'Shop the marketplace', fr:'Parcourir le marché'},
  qa_verify:{en:'Verification', fr:'Vérification'},
  qa_verified:{en:"You're verified", fr:'Vous êtes vérifié'},
  qa_checkstatus:{en:'Check your status', fr:'Vérifier votre statut'},
  qa_market:{en:'Marketplace', fr:'Marché'},
  qa_market_sub:{en:'Browse fresh produce', fr:'Parcourir les produits frais'},
  qa_cart:{en:'My Cart', fr:'Mon panier'},
  qa_cart_sub:{en:'item(s)', fr:'article(s)'},
  qa_social:{en:'Social', fr:'Social'},
  qa_social_sub:{en:"See farmers' Moments", fr:'Voir les Moments des agriculteurs'},
  qa_profile:{en:'My Profile', fr:'Mon profil'},
  qa_profile_sub:{en:'Orders & saved items', fr:'Commandes et favoris'},
  browse_full:{en:'Browse full marketplace →', fr:'Voir tout le marché →'},
  add_to_cart:{en:'Add to cart', fr:'Ajouter au panier'},
};
function t(key){
  const row = I18N[key];
  if(!row) return key;
  return row[state.lang] || row.en;
}
function toggleLanguage(){
  state.lang = state.lang==='en' ? 'fr' : 'en';
  applyLanguage();
  toast(state.lang==='en' ? 'Language set to English.' : 'Langue définie sur le français.');
}
function applyLanguage(){
  document.getElementById('langBtn').textContent = state.lang==='en' ? 'EN' : 'FR';
  document.documentElement.lang = state.lang;
  document.querySelectorAll('[data-i18n]').forEach(el=>{
    const key = el.getAttribute('data-i18n');
    if(!I18N[key]) return;
    el.innerHTML = t(key);
  });
  renderAuthArea();
  if(state.loggedIn) renderDashboard();
}


const state = {
  loggedIn:false, role:null, name:'', email:'', phone:'', avatar:null, location:'', bio:'',
  cart:{}, favorites:new Set(),
  activeCatFilters:new Set(), activeTrendFilter:null,
  currentProductId:null, currentFarmerId:null, pdQty:1, alertChannel:'sms', payMethod:'mtn', orderCounter:1024,
  editingInfo:false,
  verification:{status:'unverified', step:1, files:{id:false, selfie:false, proof:false}, contract:false, locator:false},
  listings:[], // ids of PRODUCTS owned by state.phone
  orders:[], pendingReviewStars:0, pendingPdReviewStars:0, lang:'en',
  pendingSignup:null,
  listingDraftImage:null
};
let signupRole = 'buyer';

/* ===================== NAV / VIEW ROUTING ===================== */
function go(view){
  const openViews = ['home','login','signup','otp'];
  if(!state.loggedIn && !openViews.includes(view)){
    toast('Create an account or log in to browse Theraprice.');
    view = 'login';
  }
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  const target = (view==='home' && !state.loggedIn) ? 'landing' : view;
  document.getElementById('view-'+target).classList.add('active');
  document.querySelectorAll('nav.primary a').forEach(a=>a.classList.toggle('active', a.dataset.view===view));
  window.scrollTo({top:0,behavior:'auto'});
  if(view==='profile'){
    renderProfile();
  }
  if(view==='cart'){
    renderCart();
  }
  if(view==='social'){ renderSocial(); }
  if(view==='home' && state.loggedIn){ renderDashboard(); }
  closeMobileMenu();
}
function toggleMobileMenu(){document.getElementById('mobileMenu').classList.toggle('open');}
function closeMobileMenu(){document.getElementById('mobileMenu').classList.remove('open');}

/* ===================== TOAST ===================== */
function toast(msg){
  const host=document.getElementById('toast-host');
  const t=document.createElement('div'); t.className='toast'; t.textContent=msg;
  host.appendChild(t); setTimeout(()=>t.remove(),3200);
}

/* ===================== IMAGE HELPERS ===================== */
function readFileAsDataURL(file, cb){
  const reader = new FileReader();
  reader.onload = ()=>cb(reader.result);
  reader.readAsDataURL(file);
}

/* ===================== IMAGE CROP ===================== */
const cropState = {onDone:null, minScale:1, scale:1, x:0, y:0, naturalW:0, naturalH:0, dragging:false, startX:0, startY:0, startOx:0, startOy:0, VP:280, outSize:480};
function openCropModal(file, onDone, shape){
  readFileAsDataURL(file, url=>{
    const img = document.getElementById('cropImg');
    img.onload = ()=>{
      cropState.onDone = onDone;
      cropState.naturalW = img.naturalWidth;
      cropState.naturalH = img.naturalHeight;
      cropState.minScale = Math.max(cropState.VP/cropState.naturalW, cropState.VP/cropState.naturalH);
      cropState.scale = cropState.minScale;
      cropState.x = (cropState.VP - cropState.naturalW*cropState.scale)/2;
      cropState.y = (cropState.VP - cropState.naturalH*cropState.scale)/2;
      document.getElementById('cropZoom').value = 1;
      const guide = document.getElementById('cropShapeGuide');
      guide.style.boxShadow = shape==='circle' ? '0 0 0 999px rgba(0,0,0,.55)' : 'none';
      guide.style.borderRadius = shape==='circle' ? '50%' : '0';
      guide.style.border = shape==='circle' ? '2px solid rgba(255,255,255,.9)' : 'none';
      applyCropTransform();
      document.getElementById('cropModal').classList.add('open');
    };
    img.src = url;
  });
}
function clampCropOffsets(){
  const w = cropState.naturalW*cropState.scale, h = cropState.naturalH*cropState.scale;
  cropState.x = Math.min(0, Math.max(cropState.VP-w, cropState.x));
  cropState.y = Math.min(0, Math.max(cropState.VP-h, cropState.y));
}
function applyCropTransform(){
  clampCropOffsets();
  const img = document.getElementById('cropImg');
  img.style.width = (cropState.naturalW*cropState.scale)+'px';
  img.style.height = (cropState.naturalH*cropState.scale)+'px';
  img.style.left = cropState.x+'px';
  img.style.top = cropState.y+'px';
}
function onCropZoom(v){
  cropState.scale = cropState.minScale * Number(v);
  applyCropTransform();
}
function cropPointerDown(e){
  cropState.dragging = true;
  document.getElementById('cropImg').style.cursor = 'grabbing';
  const pt = e.touches ? e.touches[0] : e;
  cropState.startX = pt.clientX; cropState.startY = pt.clientY;
  cropState.startOx = cropState.x; cropState.startOy = cropState.y;
}
function cropPointerMove(e){
  if(!cropState.dragging) return;
  const pt = e.touches ? e.touches[0] : e;
  cropState.x = cropState.startOx + (pt.clientX - cropState.startX);
  cropState.y = cropState.startOy + (pt.clientY - cropState.startY);
  applyCropTransform();
  if(e.cancelable) e.preventDefault();
}
function cropPointerUp(){ cropState.dragging = false; const img = document.getElementById('cropImg'); if(img) img.style.cursor='grab'; }
function cancelCrop(){
  document.getElementById('cropModal').classList.remove('open');
  cropState.onDone = null;
}
function confirmCrop(){
  const img = document.getElementById('cropImg');
  const canvas = document.createElement('canvas');
  canvas.width = cropState.outSize; canvas.height = cropState.outSize;
  const ctx = canvas.getContext('2d');
  const sx = -cropState.x/cropState.scale;
  const sy = -cropState.y/cropState.scale;
  const sSize = cropState.VP/cropState.scale;
  ctx.drawImage(img, sx, sy, sSize, sSize, 0, 0, cropState.outSize, cropState.outSize);
  const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
  document.getElementById('cropModal').classList.remove('open');
  if(cropState.onDone) cropState.onDone(dataUrl);
  cropState.onDone = null;
}
function thumbHTML(imageUrl, color, editable, placeholderLabel){
  const bg = color ? `background:${color};` : '';
  if(imageUrl){
    return `<img src="${imageUrl}" alt="">${editable ? '<span class="edit-pin">✎</span>' : ''}`;
  }
  return `<div class="placeholder" style="${bg}width:100%;height:100%;">
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10.5" r="1.5"/><path d="M21 15l-5-5-4 4-3-3-5 5"/></svg>
      <span>${placeholderLabel || 'No photo yet'}</span>
    </div>`;
}

/* ===================== TICKER ===================== */
function renderTicker(){
  const items = PRODUCTS.filter(p=>p.status==='live').map(p=>{
    const arrow = p.trend==='down' ? '<span class="tk-down">▼ Falling</span>' : p.trend==='up' ? '<span class="tk-up">▲ Rising</span>' : '<span class="tk-flat">● Stable</span>';
    return `<span class="ticker-item"><b>${p.name}</b> ${p.price} XAF/${p.unit} ${arrow}</span>`;
  }).join('');
  document.getElementById('tickerTrack').innerHTML = items + items;
}

/* ===================== HOME MARKET PANEL ===================== */
function renderHomePanel(){
  const featured = PRODUCTS.filter(p=>p.status==='live').slice(0,4);
  document.getElementById('homeMarketPanel').innerHTML = featured.map(p=>{
    const arrow = p.trend==='down' ? '<span class="tk-down">▼ Falling</span>' : p.trend==='up' ? '<span class="tk-up">▲ Rising</span>' : '<span class="tk-flat">● Stable</span>';
    return `<div class="market-row" onclick="openProduct(${p.id})">
      <span class="name"><span class="thumb chip-ic">${thumbHTML(p.image, p.color, false)}</span>${p.name}</span>
      <span class="price">${p.price} XAF/${p.unit} ${arrow}</span>
    </div>`;
  }).join('');
}

/* ===================== LOGGED-IN DASHBOARD ===================== */
function renderDashboard(){
  document.getElementById('dashGreeting').textContent = t('dash_greeting') + ', ' + (state.name ? state.name.split(' ')[0] : 'there') + '.';
  document.getElementById('dashSub').textContent = state.role==='farmer' ? t('dash_sub_farmer') : t('dash_sub_buyer');

  const featured = PRODUCTS.filter(p=>p.status==='live').slice(0,4);
  document.getElementById('dashMarketPanel').innerHTML = featured.length ? featured.map(p=>{
    const arrow = p.trend==='down' ? '<span class="tk-down">▼ Falling</span>' : p.trend==='up' ? '<span class="tk-up">▲ Rising</span>' : '<span class="tk-flat">● Stable</span>';
    return `<div class="market-row" onclick="openProduct(${p.id})">
      <span class="name"><span class="thumb chip-ic">${thumbHTML(p.image, p.color, false)}</span>${p.name}</span>
      <span class="price">${p.price} XAF/${p.unit} ${arrow}</span>
    </div>`;
  }).join('') : `<div style="font-size:12.5px;color:#AEB8B2;padding:10px 0;">No live listings right now.</div>`;

  let actions;
  if(state.role==='farmer'){
    const verified = state.verification && state.verification.status==='verified';
    actions = [
      {ic:'📋', lbl:t('qa_listings'), sub:t('qa_listings_sub'), fn:"go('profile')"},
      {ic:'📣', lbl:t('qa_moment'), sub:t('qa_moment_sub'), fn:"go('social')"},
      {ic:'🛒', lbl:t('qa_buy'), sub:t('qa_buy_sub'), fn:"go('marketplace')"},
      {ic:'✅', lbl:t('qa_verify'), sub: verified ? t('qa_verified') : t('qa_checkstatus'), fn:"go('profile')"}
    ];
  }else{
    actions = [
      {ic:'🛒', lbl:t('qa_market'), sub:t('qa_market_sub'), fn:"go('marketplace')"},
      {ic:'🧺', lbl:t('qa_cart'), sub: cartTotalQty()+' '+t('qa_cart_sub'), fn:"onCartClick()"},
      {ic:'📣', lbl:t('qa_social'), sub:t('qa_social_sub'), fn:"go('social')"},
      {ic:'👤', lbl:t('qa_profile'), sub:t('qa_profile_sub'), fn:"go('profile')"}
    ];
  }
  document.getElementById('dashQuickActions').innerHTML = actions.map(a=>
    `<div class="qa-card" onclick="${a.fn}"><span class="ic">${a.ic}</span><span class="lbl">${a.lbl}</span><span class="sub">${a.sub}</span></div>`
  ).join('');

  const recent = MOMENTS.slice(0,3);
  document.getElementById('dashMoments').innerHTML = recent.length ? recent.map(m=>`
    <div class="dash-moment-mini" onclick="go('social')" style="cursor:pointer;">
      <div class="who">${farmerName(m.farmerId)}</div>
      <div class="meta">${m.time}</div>
      <p>${m.text}</p>
    </div>`).join('') : `<div class="empty-state">No Moments yet — check back soon.</div>`;
}

/* ===================== AUTH ===================== */
function initialsOf(name){ return (name||'U').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase(); }
function avatarInnerHTML(avatarUrl, name){
  return avatarUrl ? `<img src="${avatarUrl}" alt="">` : initialsOf(name);
}
function renderAuthArea(){
  const area = document.getElementById('authArea');
  const cartBtn = document.getElementById('cartBtn');
  if(state.loggedIn){
    area.innerHTML = `<div style="display:flex;align-items:center;gap:8px;">
      <button class="btn btn-sm" style="background:rgba(255,255,255,.15);color:#fff;" onclick="logout()">${t('auth_logout')}</button>
      <button class="avatar" style="border:none;" onclick="go('profile')" title="My profile">${avatarInnerHTML(state.avatar, state.name)}</button>
    </div>`;
    cartBtn.style.display = 'flex';
  }else{
    area.innerHTML = `<a href="#" onclick="go('login');return false;" style="font-size:14px;font-weight:600;color:#fff;margin-right:2px;">${t('auth_login')}</a>
      <button class="btn btn-lime btn-sm" onclick="go('signup')">${t('auth_getstarted')}</button>`;
    cartBtn.style.display = 'none';
  }
  document.getElementById('mktPostBtn').style.display = (state.loggedIn && state.role==='farmer') ? 'inline-flex' : 'none';
}
/* ===================== ACCOUNTS (one identity per phone number) ===================== */
let ACCOUNTS = {};
function blankIdentity(){
  return {
    name:'', email:'', role:null, avatar:null, location:'', bio:'',
    verification:{status:'unverified', step:1, files:{id:false, selfie:false, proof:false}, contract:false, locator:false},
    listings:[], orders:[], favorites:new Set()
  };
}
function saveAccount(){
  if(!state.phone) return;
  ACCOUNTS[state.phone] = {
    phone:state.phone, name:state.name, email:state.email, role:state.role,
    avatar:state.avatar, location:state.location, bio:state.bio,
    verification:state.verification, listings:state.listings.slice(),
    orders:state.orders.slice(), favorites:new Set(state.favorites)
  };
}
function applyIdentity(id){
  state.name=id.name; state.email=id.email; state.role=id.role;
  state.avatar=id.avatar; state.location=id.location; state.bio=id.bio;
  state.verification=id.verification; state.listings=id.listings.slice();
  state.orders=id.orders.slice(); state.favorites=new Set(id.favorites);
}
function logout(){
  saveAccount();
  state.loggedIn=false; state.phone=''; state.cart={};
  applyIdentity(blankIdentity());
  renderAuthArea(); toast("You've been logged out."); go('home');
}
function doLogin(e){
  e.preventDefault();
  const phone=document.getElementById('li-phone').value.trim();
  if(!phone){ toast('Enter your phone number.'); return false; }
  state.phone = phone;
  const existing = ACCOUNTS[phone];
  if(existing){
    applyIdentity(existing);
  }else{
    applyIdentity(blankIdentity());
    state.role = 'buyer';
    state.name = 'Buyer Achu';
  }
  state.loggedIn=true;
  ensureMyFarmerRecord();
  saveAccount();
  renderAuthArea(); toast('Welcome back, '+state.name.split(' ')[0]+'.');
  go(state.role==='farmer' ? 'profile' : 'home');
  return false;
}
function ensureMyFarmerRecord(){
  if(state.role!=='farmer') return;
  let mine = FARMERS.find(f=>f.id===state.phone);
  if(!mine){
    mine = {id:state.phone, name:state.name, location:state.location, bio:state.bio, verified:false, avatar:state.avatar};
    FARMERS.push(mine);
  }else{
    mine.name=state.name; mine.location=state.location; mine.bio=state.bio; mine.avatar=state.avatar;
    mine.verified = state.verification.status==='verified';
  }
}
function setSignupRole(role){
  signupRole=role;
  document.getElementById('role-buyer').classList.toggle('active', role==='buyer');
  document.getElementById('role-farmer').classList.toggle('active', role==='farmer');
}
function isStrongPassword(pw){
  if(!pw || pw.length<=6) return false;
  if(!/[A-Za-z]/.test(pw)) return false;
  if(!/[0-9]/.test(pw)) return false;
  if(!/[^A-Za-z0-9]/.test(pw)) return false;
  return true;
}
function doSignup(e){
  e.preventDefault();
  const name=document.getElementById('su-name').value;
  const phone=document.getElementById('su-phone').value;
  const email=document.getElementById('su-email').value.trim();
  const pass=document.getElementById('su-pass').value;
  if(!isStrongPassword(pass)){ toast('Password must be more than 6 characters and include letters, digits, and a special character.'); return false; }
  const channel = document.querySelector('input[name="su-otp-channel"]:checked').value;
  if(channel==='email' && !email){ toast('Add an email address, or choose Phone SMS instead.'); return false; }
  if(ACCOUNTS[phone]){ toast('An account with that phone number already exists — try logging in instead.'); return false; }
  state.pendingSignup = {name, phone, email, role:signupRole, otpChannel:channel};
  const target = channel==='email' ? email : phone;
  document.getElementById('otpHeading').textContent = channel==='email' ? 'Verify your email' : 'Verify your phone';
  document.getElementById('otpTarget').textContent = target;
  go('otp');
  toast('A 6-digit verification code was sent to '+target+(channel==='email'?' by email.':' by SMS.'));
  return false;
}
function commitSignup(){
  const p = state.pendingSignup;
  applyIdentity(blankIdentity());
  state.loggedIn=true; state.role=p.role; state.name=p.name; state.phone=p.phone; state.email=p.email;
  ensureMyFarmerRecord();
  saveAccount();
  renderAuthArea();
  toast('Welcome to Theraprice, '+p.name.split(' ')[0]+'.');
  go('profile');
}
function verifyOtp(e){
  e.preventDefault();
  const digits = [...document.querySelectorAll('.otp-d')].map(i=>i.value).join('');
  if(digits.length!==6 || !/^\d{6}$/.test(digits)){ toast('Enter the 6-digit code to continue.'); return false; }
  commitSignup();
  return false;
}
function resendOtp(){
  const p = state.pendingSignup;
  const channel = p?.otpChannel || 'phone';
  const target = channel==='email' ? p?.email : p?.phone;
  toast('A new code was sent to '+(target||'you')+(channel==='email'?' by email.':' by SMS.'));
}
document.addEventListener('input', e=>{
  if(e.target.classList.contains('otp-d')){
    e.target.value = e.target.value.replace(/\D/g,'').slice(0,1);
    if(e.target.value && e.target.nextElementSibling && e.target.nextElementSibling.classList.contains('otp-d')) e.target.nextElementSibling.focus();
  }
});

/* ===================== CART / FAVORITES ===================== */
function cartTotalQty(){ return Object.values(state.cart).reduce((a,b)=>a+b,0); }
function updateCartBadge(){ document.getElementById('cartCount').textContent = cartTotalQty(); }
function onCartClick(){
  if(!state.loggedIn){ toast('Log in to view your cart.'); go('login'); return; }
  go('cart');
}
function changePdQty(delta){
  state.pdQty = Math.max(1, state.pdQty+delta);
  document.getElementById('pd-qty').textContent = state.pdQty;
  updatePdQtyTotal();
}
function updatePdQtyTotal(){
  const p = PRODUCTS.find(x=>x.id===state.currentProductId);
  if(!p) return;
  document.getElementById('pd-qty-total').textContent = '= '+(p.price*state.pdQty)+' XAF';
}
function addToCart(){
  if(!state.loggedIn){ toast('Log in to add items to your cart.'); go('login'); return; }
  const id = state.currentProductId;
  state.cart[id] = (state.cart[id]||0) + state.pdQty;
  updateCartBadge();
  toast(`Added ${state.pdQty} to cart.`);
}
function renderCart(){
  const card = document.getElementById('cartItemsCard');
  const ids = Object.keys(state.cart).filter(id=>state.cart[id]>0);
  if(!ids.length){
    card.innerHTML = `<div class="cart-empty"><div class="ic">🛒</div>Your cart is empty.<br><br><button class="btn btn-primary" onclick="go('marketplace')">Browse Marketplace</button></div>`;
    document.getElementById('cartSummaryRows').innerHTML = '';
    document.getElementById('checkoutBtn').disabled = true;
    return;
  }
  document.getElementById('checkoutBtn').disabled = false;
  card.innerHTML = ids.map(idStr=>{
    const id = Number(idStr); const qty = state.cart[id];
    const p = PRODUCTS.find(x=>x.id===id);
    const lineTotal = p.price*qty;
    return `<div class="cart-item">
      <div class="cart-thumb thumb">${thumbHTML(p.image,p.color,false)}</div>
      <div><div class="cart-item-name">${p.name}</div><div class="cart-item-sub">${farmerName(p.farmerId)} · ${p.price} XAF/${p.unit}</div>
        <button class="cart-remove" onclick="removeFromCart(${id})">Remove</button></div>
      <div class="qty-stepper"><button type="button" onclick="changeCartQty(${id},-1)">−</button><span class="qty-val">${qty}</span><button type="button" onclick="changeCartQty(${id},1)">+</button></div>
      <div class="cart-line-total mono">${lineTotal.toLocaleString()} XAF</div>
    </div>`;
  }).join('');
  renderCartSummary('cartSummaryRows');
}
function changeCartQty(id, delta){ state.cart[id] = Math.max(1, (state.cart[id]||1) + delta); updateCartBadge(); renderCart(); }
function removeFromCart(id){ delete state.cart[id]; updateCartBadge(); renderCart(); toast('Removed from cart.'); }
function cartSubtotal(){
  return Object.entries(state.cart).reduce((sum,[id,qty])=>{ const p=PRODUCTS.find(x=>x.id===Number(id)); return sum+(p?p.price*qty:0); },0);
}
function renderCartSummary(targetId){
  const subtotal = cartSubtotal(); const delivery = subtotal>0?1500:0; const total=subtotal+delivery;
  document.getElementById(targetId).innerHTML = `
    <div class="summary-row"><span>Subtotal (${cartTotalQty()} item${cartTotalQty()===1?'':'s'})</span><span class="mono">${subtotal.toLocaleString()} XAF</span></div>
    <div class="summary-row"><span>Delivery</span><span class="mono">${delivery.toLocaleString()} XAF</span></div>
    <div class="summary-row total"><span>Total</span><span class="mono">${total.toLocaleString()} XAF</span></div>`;
}
function goCheckout(){
  if(!Object.keys(state.cart).length){ toast('Your cart is empty.'); return; }
  document.getElementById('co-name').value = state.name || '';
  document.getElementById('co-phone').value = state.phone || '';
  renderCartSummary('checkoutSummaryRows');
  go('checkout');
}
function setPayMethod(m){ state.payMethod=m; document.querySelectorAll('.pay-option').forEach(b=>b.classList.toggle('active', b.dataset.pay===m)); }
function placeOrder(){
  const address = document.getElementById('co-address').value.trim();
  const momo = document.getElementById('co-momo').value.trim();
  if(!address){ toast('Add a delivery address to continue.'); return; }
  if(!momo){ toast('Add a Mobile Money number to continue.'); return; }
  state.orderCounter++;
  const orderRef = 'TP-'+state.orderCounter;
  Object.entries(state.cart).forEach(([id,qty])=>{
    const p = PRODUCTS.find(x=>x.id===Number(id));
    if(!p) return;
    const lineId = Date.now()+Math.floor(Math.random()*1000);
    const gross = p.price*qty;
    const commission = Math.round(gross*PLATFORM_COMMISSION_RATE);
    const net = gross-commission;
    state.orders.unshift({id:lineId, orderRef, name:p.name, unit:p.unit, qty, status:'out_for_delivery', deliveryConfirmed:false, note:`Qty ${qty} · Placed just now`});
    SALES.unshift({id:lineId, orderRef, productId:p.id, productName:p.name, farmerId:p.farmerId, buyerName:state.name, qty, unit:p.unit, unitPrice:p.price, gross, commission, net, status:'out_for_delivery', date:'just now'});
  });
  document.getElementById('confirmOrderId').textContent = 'Order #'+orderRef;
  state.cart = {}; updateCartBadge();
  go('confirmation');
}
function markOrderDelivered(id, confirmedBy){
  const order = state.orders.find(o=>o.id===id);
  if(order){ order.status = 'delivered'; order.deliveryConfirmed = true; order.note = confirmedBy==='farmer' ? 'Delivered · Confirmed by farmer just now' : 'Delivered · Confirmed by you just now'; }
  const sale = SALES.find(s=>s.id===id);
  if(sale){ sale.status = 'delivered'; sale.date = 'just now'; }
}
function confirmDelivery(orderId){
  markOrderDelivered(orderId, 'buyer');
  renderListings();
  toast('Thanks — delivery confirmed!');
}
function farmerConfirmDelivery(saleId){
  markOrderDelivered(saleId, 'farmer');
  renderFarmerOrders();
  renderPayouts();
  toast('Delivery confirmed — payout released.');
}
function toggleFavCurrent(){
  if(!state.loggedIn){ toast('Log in to save favorites.'); go('login'); return; }
  const id=state.currentProductId;
  if(state.favorites.has(id)){ state.favorites.delete(id); toast('Removed from favorites.'); }
  else{ state.favorites.add(id); toast('Saved to favorites.'); }
  updateFavButton();
}
function updateFavButton(){
  const btn=document.getElementById('pd-fav-btn');
  btn.textContent = state.favorites.has(state.currentProductId) ? '♥ Saved' : '♡ Save';
}

/* ===================== MARKETPLACE ===================== */
function farmerName(id){ const f=FARMERS.find(x=>x.id===id); return f ? (id===state.phone ? state.name : f.name) : 'Unknown seller'; }
function farmerVerified(id){ if(id===state.phone) return state.verification.status==='verified'; const f=FARMERS.find(x=>x.id===id); return f ? f.verified : false; }
function farmerAvatar(id){ if(id===state.phone) return state.avatar; const f=FARMERS.find(x=>x.id===id); return f ? f.avatar : null; }

function renderFilters(){
  document.getElementById('catFilters').innerHTML = CATEGORIES.map(c=>`<label><input type="checkbox" data-cat="${c}" onchange="toggleCatFilter('${c}')"> ${c}</label>`).join('');
  document.getElementById('trendFilters').innerHTML = `
    <button class="chip-toggle" data-trend="down" onclick="toggleTrendFilter('down')">▼ Falling</button>
    <button class="chip-toggle" data-trend="up" onclick="toggleTrendFilter('up')">▲ Rising</button>
    <button class="chip-toggle" data-trend="flat" onclick="toggleTrendFilter('flat')">● Stable</button>`;
}
function toggleCatFilter(c){ if(state.activeCatFilters.has(c)) state.activeCatFilters.delete(c); else state.activeCatFilters.add(c); renderMarketplace(); }
function toggleTrendFilter(t){
  state.activeTrendFilter = state.activeTrendFilter===t ? null : t;
  document.querySelectorAll('[data-trend]').forEach(b=>b.classList.toggle('active', b.dataset.trend===state.activeTrendFilter));
  renderMarketplace();
}
function renderMarketplace(){
  const q = (document.getElementById('searchInput')?.value || '').toLowerCase();
  const verifiedOnly = document.getElementById('verifiedOnly')?.checked;
  const sort = document.getElementById('sortSelect')?.value || 'new';
  let items = PRODUCTS.filter(p=>{
    if(p.status!=='live') return false;
    if(q && !p.name.toLowerCase().includes(q)) return false;
    if(state.activeCatFilters.size && !state.activeCatFilters.has(p.category)) return false;
    if(verifiedOnly && !farmerVerified(p.farmerId)) return false;
    if(state.activeTrendFilter && p.trend!==state.activeTrendFilter) return false;
    return true;
  });
  if(sort==='asc') items = items.slice().sort((a,b)=>a.price-b.price);
  if(sort==='desc') items = items.slice().sort((a,b)=>b.price-a.price);
  if(sort==='rating') items = items.slice().sort((a,b)=>(farmerVerified(b.farmerId)?1:0)-(farmerVerified(a.farmerId)?1:0));

  const grid=document.getElementById('productGrid');
  if(!items.length){ grid.innerHTML = `<div class="empty-state">No produce matches those filters yet. Try clearing a filter.</div>`; return; }
  grid.innerHTML = items.map(p=>{
    const trendChip = p.trend==='down' ? '<span class="trend-chip down">▼</span>' : p.trend==='up' ? '<span class="trend-chip up">▲</span>' : '<span class="trend-chip flat">●</span>';
    return `<div class="product-card" onclick="openProduct(${p.id})">
      <div class="product-thumb thumb">
        ${farmerVerified(p.farmerId) ? '<span class="v-badge">✓ Verified</span>' : ''}
        ${trendChip}
        ${thumbHTML(p.image, p.color, false, 'Add photo')}
      </div>
      <div class="product-body">
        <div class="p-name">${p.name}</div>
        <div class="p-seller" onclick="event.stopPropagation();openFarmerProfile('${p.farmerId}')">${farmerName(p.farmerId)}</div>
        <div class="p-price">${p.price} <span class="p-unit">XAF/${p.unit}</span></div>
      </div>
    </div>`;
  }).join('');
}

/* ===================== PRODUCT DETAIL ===================== */
function openProduct(id){
  const p = PRODUCTS.find(x=>x.id===id);
  state.currentProductId = id;
  document.getElementById('pd-crumb').textContent = p.name;
  document.getElementById('pd-image').innerHTML = thumbHTML(p.image, p.color, false, 'No photo yet');
  document.getElementById('pd-tag').textContent = p.category;
  document.getElementById('pd-name').textContent = p.name;
  document.getElementById('pd-price').textContent = p.price+' XAF';
  document.getElementById('pd-unit').textContent = 'per '+p.unit;
  document.getElementById('pd-seller-name').textContent = farmerName(p.farmerId);
  document.getElementById('pd-seller-avatar').innerHTML = avatarInnerHTML(farmerAvatar(p.farmerId), farmerName(p.farmerId));
  document.getElementById('pd-seller-link').onclick = ()=>{ openFarmerProfile(p.farmerId); return false; };
  document.getElementById('pd-vbadge').innerHTML = farmerVerified(p.farmerId) ? '<span class="v-status verified" style="padding:2px 9px;">✓ Verified</span>' : '<span class="v-status unverified" style="padding:2px 9px;">Unverified</span>';
  const trendChip = p.trend==='down' ? '<span class="trend-chip down">▼ Falling</span>' : p.trend==='up' ? '<span class="trend-chip up">▲ Rising</span>' : '<span class="trend-chip flat">● Stable</span>';
  document.getElementById('pd-trend').innerHTML = trendChip;
  document.getElementById('pd-desc').textContent = p.desc;
  updateFavButton();
  state.pdQty = 1;
  document.getElementById('pd-qty').textContent = 1;
  updatePdQtyTotal();

  renderProductReviews(id);

  go('product');
}
function renderProductReviews(productId){
  const list = PRODUCT_REVIEWS.filter(r=>r.productId===productId);
  const summaryEl = document.getElementById('pd-review-summary');
  const listEl = document.getElementById('pd-reviews');
  const formEl = document.getElementById('pd-review-form');
  const p = PRODUCTS.find(x=>x.id===productId);
  if(!list.length){
    summaryEl.innerHTML = `<span style="font-size:13px;color:var(--ink-soft);">No reviews yet — be the first to review ${p?p.name:'this product'}.</span>`;
  }else{
    const avg = list.reduce((a,r)=>a+r.stars,0)/list.length;
    summaryEl.innerHTML = `<div class="review-summary-row"><span class="avg">${avg.toFixed(1)}</span>${starsHTML(avg,20)}<span style="font-size:12.5px;color:var(--ink-soft);">based on ${list.length} review${list.length===1?'':'s'}</span></div>`;
  }
  listEl.innerHTML = list.map(r=>`<div class="review-card" style="border:1px solid var(--line);border-radius:14px;padding:16px;background:#fff;">
    <div class="stars" style="color:var(--stable);font-size:13px;margin-bottom:8px;">${starsHTML(r.stars)}</div>
    <p style="font-size:12.5px;margin-bottom:12px;">${r.text}</p>
    <div class="reviewer" style="display:flex;align-items:center;gap:8px;font-size:12px;color:var(--ink-soft);"><span class="mini-av" style="width:24px;height:24px;border-radius:50%;background:var(--paper-dim);display:flex;align-items:center;justify-content:center;font-size:11px;">${r.author[0]}</span>${r.author} · ${r.time}</div></div>`).join('');
  if(!state.loggedIn){
    formEl.innerHTML = `<div class="comment-gate">Log in to leave a review.</div>`;
  }else{
    state.pendingPdReviewStars = 0;
    formEl.innerHTML = `<div class="field"><label>Your rating</label>
        <div class="star-input" id="pdReviewStarInput">${[1,2,3,4,5].map(n=>`<span data-n="${n}" onclick="setPdReviewStars(${n})">★</span>`).join('')}</div>
      </div>
      <div class="field"><label>Your review</label><textarea id="pdReviewText" rows="2" placeholder="How was this product?"></textarea></div>
      <button class="btn btn-primary btn-sm" onclick="submitProductReview(${productId})">Post review</button>`;
  }
}
function setPdReviewStars(n){
  state.pendingPdReviewStars = n;
  document.querySelectorAll('#pdReviewStarInput span').forEach(s=>s.classList.toggle('on', Number(s.dataset.n)<=n));
}
function submitProductReview(productId){
  if(!state.pendingPdReviewStars){ toast('Pick a star rating first.'); return; }
  const text = document.getElementById('pdReviewText').value.trim();
  if(!text){ toast('Add a few words about your experience.'); return; }
  PRODUCT_REVIEWS.unshift({id:Date.now(), productId, authorId:state.phone, author:state.name, stars:state.pendingPdReviewStars, text, time:'just now'});
  toast('Review posted — thanks!');
  renderProductReviews(productId);
}
function openPredictionCurrent(){ openPrediction(state.currentProductId); }

/* ===================== PREDICTION DETAIL ===================== */
function dialSVG(pct, colorVar){
  const r=52, c=2*Math.PI*r; const dash=(pct/100)*c;
  return `<svg width="150" height="150" viewBox="0 0 150 150">
    <circle cx="75" cy="75" r="${r}" fill="none" stroke="#F1F5EA" stroke-width="15"/>
    <circle cx="75" cy="75" r="${r}" fill="none" stroke="${colorVar}" stroke-width="15" stroke-linecap="round" stroke-dasharray="${dash.toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 75 75)"/>
    <text x="75" y="70" text-anchor="middle" font-family="Fraunces,serif" font-weight="600" font-size="26" fill="#37474F">${pct}%</text>
    <text x="75" y="90" text-anchor="middle" font-family="Inter,sans-serif" font-size="10" fill="#757575">confidence</text>
  </svg>`;
}
/* ===================== BACKEND PREDICTION HOOK =====================
   Right now p.trend / p.prob / p.tier / p.range / p.mid / p.why come from
   the static PRODUCTS array above. To plug in your real model, replace
   this function's body with a fetch() call to your backend, and make
   sure the response fills the SAME fields on the product object before
   openPrediction() reads them:
     trend : 'up' | 'down' | 'flat'
     prob  : integer 0-100  (model confidence)
     tier  : 'high' | 'medium' | 'low'   -> controls which UI (dial / range / arrow-only) is shown
     range : [low, high]  or null        -> required if tier is 'high' or 'medium'
     mid   : number or null              -> point estimate, required if tier is 'high'
     why   : {supply, season, weather, demand}  -> short strings shown in the "why" panel

   Example:
   async function fetchPredictionFromBackend(productId){
     const res = await fetch(`https://YOUR-API/predict/${productId}`);
     const data = await res.json();
     const p = PRODUCTS.find(x=>x.id===productId);
     Object.assign(p, { trend:data.trend, prob:data.prob, tier:data.tier, range:data.range, mid:data.mid, why:data.why });
   }
   Then call `await fetchPredictionFromBackend(id);` at the top of openPrediction(id)
   below, before it reads p.trend/p.prob/etc. Show a loading state in #pred-body
   while the request is in flight if the call is slow.
*/
function openPrediction(id){
  const p = PRODUCTS.find(x=>x.id===id);
  state.currentProductId = id;
  document.getElementById('pred-back').textContent = p.name;
  document.getElementById('pred-back').onclick = ()=>{ openProduct(id); return false; };
  document.getElementById('pred-name').textContent = p.name+' — Price Prediction';
  document.getElementById('pred-sub').textContent = farmerName(p.farmerId)+' listing · Yaoundé market · updated today';

  const trendChip = p.trend==='down' ? '<span class="trend-chip down">▼ Falling</span>' : p.trend==='up' ? '<span class="trend-chip up">▲ Rising</span>' : '<span class="trend-chip flat">● Stable</span>';
  const color = p.trend==='down' ? 'var(--down)' : p.trend==='up' ? 'var(--up)' : 'var(--stable)';
  let body='', note='';
  if(p.tier==='high'){
    body = `<div class="dial-card-head"><div><div class="crop" style="font-weight:700;color:var(--ink);font-size:16px;">Price Forecast</div><div class="updated">Chance prices move within 7 days</div></div>${trendChip}</div>
      <div class="dial-big">${dialSVG(p.prob, color)}<div class="dial-caption">Expected price: <b>${p.mid} XAF/${p.unit}</b><br>Likely range ${p.range[0]}–${p.range[1]} XAF/${p.unit}</div></div>`;
    note = `<b>High confidence</b> — 70%+ backtested accuracy. Full numeric output shown: expected price, range, and probability.`;
  }else if(p.tier==='medium'){
    body = `<div class="dial-card-head"><div><div class="crop" style="font-weight:700;color:var(--ink);font-size:16px;">Price Forecast</div><div class="updated">Medium-confidence outlook</div></div>${trendChip}</div>
      <div class="range-display"><div class="num">${p.range[0]}–${p.range[1]} <span style="font-size:14px;color:var(--ink-soft);">XAF/${p.unit}</span></div><div class="lbl">Likely price range — no single point price shown</div></div>`;
    note = `<b>Medium confidence</b> (40–70% backtested accuracy) — Theraprice shows a range only, deliberately without one exact price, so it doesn't imply more precision than the data supports.`;
  }else{
    const arrow = p.trend==='down' ? '▼' : p.trend==='up' ? '▲' : '●';
    body = `<div class="dial-card-head"><div><div class="crop" style="font-weight:700;color:var(--ink);font-size:16px;">Price Forecast</div><div class="updated">Low-confidence outlook</div></div>${trendChip}</div>
      <div class="direction-display"><div class="arrow" style="color:${color};">${arrow}</div><div class="lbl" style="margin-top:6px;font-size:13px;color:var(--ink-soft);">Direction only — history for this listing is too thin for a number</div></div>`;
    note = `<b>Low confidence</b> — sparse or contradictory history. Theraprice shows a directional badge only (Rising / Falling / Stable), clearly labelled as low confidence.`;
  }
  document.getElementById('pred-body').innerHTML = body;
  document.getElementById('pred-tier-note').innerHTML = note;
  document.getElementById('why-supply').textContent = p.why.supply;
  document.getElementById('why-season').textContent = p.why.season;
  document.getElementById('why-weather').textContent = p.why.weather;
  document.getElementById('why-demand').textContent = p.why.demand;
  go('prediction');
}

/* ===================== ALERT MODAL ===================== */
function openAlertModal(){
  const p = PRODUCTS.find(x=>x.id===state.currentProductId);
  document.getElementById('alertModalSub').textContent = `Receive instant notifications when our models detect sudden price jumps or drop warnings for ${p.name} in Yaoundé.`;
  document.getElementById('alertPhone').value = state.phone || '';
  document.getElementById('alertModal').classList.add('open');
}
function closeAlertModal(){ document.getElementById('alertModal').classList.remove('open'); }
function setAlertChannel(ch){
  state.alertChannel=ch;
  document.getElementById('channel-sms').classList.toggle('active', ch==='sms');
  document.getElementById('channel-push').classList.toggle('active', ch==='push');
}
function submitAlert(){
  const p = PRODUCTS.find(x=>x.id===state.currentProductId);
  closeAlertModal();
  toast(`Subscribed to ${p.name} alerts via ${state.alertChannel.toUpperCase()}.`);
}

/* ===================== FARMER PUBLIC PROFILE ===================== */
function openFarmerProfile(farmerId){
  state.currentFarmerId = farmerId;
  const name = farmerName(farmerId);
  const f = farmerId===state.phone ? {location:state.location, bio:state.bio} : FARMERS.find(x=>x.id===farmerId);
  document.getElementById('fp-avatar').innerHTML = avatarInnerHTML(farmerAvatar(farmerId), name);
  document.getElementById('fp-name').textContent = name;
  document.getElementById('fp-loc').textContent = (f && f.location) ? '📍 '+f.location : 'Theraprice farmer';
  document.getElementById('fp-bio').textContent = (f && f.bio) ? f.bio : 'This farmer has not added a bio yet.';
  const vEl = document.getElementById('fp-vstatus');
  const verified = farmerVerified(farmerId);
  vEl.className = 'v-status '+(verified?'verified':'unverified');
  vEl.textContent = verified ? '✓ Verified Farmer' : '● Not Verified';

  const listings = PRODUCTS.filter(p=>p.farmerId===farmerId && p.status==='live');
  const grid = document.getElementById('fp-listings');
  grid.innerHTML = listings.length ? listings.map(p=>`
    <div class="product-card" onclick="openProduct(${p.id})">
      <div class="product-thumb thumb">${thumbHTML(p.image,p.color,false)}</div>
      <div class="product-body"><div class="p-name">${p.name}</div><div class="p-price">${p.price} <span class="p-unit">XAF/${p.unit}</span></div></div>
    </div>`).join('') : `<div class="empty-state">No live listings from this farmer yet.</div>`;

  const fpMoments = document.getElementById('fp-moments');
  const theirMoments = MOMENTS.filter(m=>m.farmerId===farmerId);
  fpMoments.innerHTML = theirMoments.length ? theirMoments.map(m=>renderMomentCard(m)).join('') : `<div class="empty-state">No Moments posted yet.</div>`;
  renderReviews(farmerId);
  go('farmer');
}
function starsHTML(n, size){
  n = Math.round(n);
  let out = '';
  for(let i=1;i<=5;i++) out += i<=n ? '★' : '☆';
  return `<span class="star-display" ${size?`style="font-size:${size}px;"`:''}>${out}</span>`;
}
function renderReviews(farmerId){
  const list = REVIEWS.filter(r=>r.farmerId===farmerId);
  const summaryEl = document.getElementById('fp-review-summary');
  const listEl = document.getElementById('fp-reviews');
  const formEl = document.getElementById('fp-review-form');
  if(!list.length){
    summaryEl.innerHTML = `<span style="font-size:13px;color:var(--ink-soft);">No reviews yet — be the first to review ${farmerName(farmerId)}.</span>`;
  }else{
    const avg = list.reduce((a,r)=>a+r.stars,0)/list.length;
    summaryEl.innerHTML = `<div class="review-summary-row"><span class="avg">${avg.toFixed(1)}</span>${starsHTML(avg,20)}<span style="font-size:12.5px;color:var(--ink-soft);">based on ${list.length} review${list.length===1?'':'s'}</span></div>`;
  }
  listEl.innerHTML = list.length ? list.map(r=>`
    <div class="review-card"><div class="rev-head"><span class="rev-who">${r.author}</span><span class="rev-time">${r.time}</span></div>
      ${starsHTML(r.stars)}<p>${r.text}</p></div>`).join('') : '';
  if(!state.loggedIn){
    formEl.innerHTML = `<div class="comment-gate">Log in to leave a review.</div>`;
  }else if(farmerId===state.phone){
    formEl.innerHTML = '';
  }else{
    state.pendingReviewStars = 0;
    formEl.innerHTML = `<div class="field"><label>Your rating</label>
        <div class="star-input" id="reviewStarInput">${[1,2,3,4,5].map(n=>`<span data-n="${n}" onclick="setReviewStars(${n})">★</span>`).join('')}</div>
      </div>
      <div class="field"><label>Your review</label><textarea id="reviewText" rows="2" placeholder="How was this farmer's produce and delivery?"></textarea></div>
      <button class="btn btn-primary btn-sm" onclick="submitReview('${farmerId}')">Post review</button>`;
  }
}
function setReviewStars(n){
  state.pendingReviewStars = n;
  document.querySelectorAll('#reviewStarInput span').forEach(s=>s.classList.toggle('on', Number(s.dataset.n)<=n));
}
function submitReview(farmerId){
  if(!state.pendingReviewStars){ toast('Pick a star rating first.'); return; }
  const text = document.getElementById('reviewText').value.trim();
  if(!text){ toast('Add a few words about your experience.'); return; }
  REVIEWS.unshift({id:Date.now(), farmerId, authorId:state.phone, author:state.name, stars:state.pendingReviewStars, text, time:'just now'});
  toast('Review posted — thanks!');
  renderReviews(farmerId);
}

/* ===================== SOCIAL / MOMENTS ===================== */
function renderSocial(){
  const wrap = document.getElementById('composerWrap');
  if(state.loggedIn && state.role==='farmer'){
    wrap.innerHTML = `<div class="composer">
      <div class="composer-head"><span class="avatar">${avatarInnerHTML(state.avatar, state.name)}</span><div style="font-weight:700;font-size:13.5px;">${state.name}</div></div>
      <textarea id="momentText" placeholder="Share a harvest update, weather note, or what's coming to market…"></textarea>
      <div class="composer-thumb-row">
        <label class="thumb editable composer-thumb" id="momentThumbPicker"><input type="file" accept="image/*" class="vh" id="momentImageInput" onchange="handleMomentImageUpload(event)"></label>
        <span style="font-size:12px;color:var(--ink-soft);">Add a photo (optional)</span>
      </div>
      <div class="composer-actions"><span style="font-size:11.5px;color:var(--ink-soft);">Visible to every Theraprice buyer</span><button class="btn btn-primary btn-sm" onclick="postMoment()">Post Moment</button></div>
    </div>`;
    document.getElementById('momentThumbPicker').innerHTML += thumbHTML(state.momentDraftImage, '#F1F5EA', true, 'Add photo');
  }else if(state.loggedIn && state.role==='buyer'){
    wrap.innerHTML = `<div class="comment-gate">Only farmer accounts can post Moments. You can comment on any Moment below.</div>`;
  }else{
    wrap.innerHTML = `<div class="comment-gate">Log in as a buyer to comment, or as a farmer to post a Moment. <a href="#" onclick="go('login');return false;" style="color:var(--green-deep);font-weight:600;">Log in</a></div>`;
  }
  renderMomentsFeed();
}
function handleMomentImageUpload(e){
  const file = e.target.files[0]; if(!file) return;
  e.target.value='';
  openCropModal(file, url=>{ state.momentDraftImage=url; renderSocial(); const ta=document.getElementById('momentText'); if(ta) ta.focus(); }, 'square');
}
function postMoment(){
  const text = document.getElementById('momentText').value.trim();
  if(!text){ toast('Write something before posting.'); return; }
  ensureMyFarmerRecord();
  MOMENTS.unshift({id:Date.now(), farmerId:state.phone, text, image:state.momentDraftImage||null, time:'just now', comments:[], likes:0, likedByMe:false});
  state.momentDraftImage=null;
  toast('Moment posted.');
  renderSocial();
}
function renderMomentsFeed(){
  const feed = document.getElementById('momentsFeed');
  if(!MOMENTS.length){ feed.innerHTML = `<div class="social-empty">No Moments yet.</div>`; return; }
  feed.innerHTML = MOMENTS.map(m=>renderMomentCard(m)).join('');
}
function renderMomentCard(m){
  const name = farmerName(m.farmerId);
  const canComment = state.loggedIn;
  const canInteract = state.loggedIn;
  return `<div class="moment-card">
      <div class="moment-head">
        <span class="avatar" onclick="openFarmerProfile('${m.farmerId}')" style="cursor:pointer;">${avatarInnerHTML(farmerAvatar(m.farmerId), name)}</span>
        <div><div class="who" onclick="openFarmerProfile('${m.farmerId}')">${name}</div><div class="meta">${m.time}</div></div>
      </div>
      <div class="moment-body">
        <p>${m.text}</p>
        ${m.image ? `<div class="moment-photo thumb">${thumbHTML(m.image,'#F1F5EA',false)}</div>` : ''}
      </div>
      <div class="moment-foot">
        <button class="moment-like ${m.likedByMe?'liked':''}" onclick="${canInteract?`toggleMomentLike(${m.id})`:`toast('Log in to like Moments.')`}">${m.likedByMe?'❤️':'🤍'} ${m.likes||0}</button>
        <span>💬 ${countAllComments(m)} comment${countAllComments(m)===1?'':'s'}</span>
      </div>
      <div class="comment-list">${m.comments.map(c=>renderCommentNode(m.id, c, 0)).join('')}</div>
      ${canComment ? `<div class="comment-form">
          <input type="text" placeholder="Write a comment…" id="cbox-${m.id}" onkeydown="if(event.key==='Enter'){submitComment(${m.id});}">
          <button class="btn btn-primary btn-sm" onclick="submitComment(${m.id})">Post</button>
        </div>` : (state.loggedIn ? '' : `<div class="comment-gate">Log in to comment.</div>`)}
    </div>`;
}
function countAllComments(m){
  function countList(list){ return list.reduce((n,c)=> n + 1 + (c.replies?countList(c.replies):0), 0); }
  return countList(m.comments);
}
function findCommentNode(m, nodeId){
  function search(list){
    for(const n of list){
      if(n.id===nodeId) return n;
      if(n.replies && n.replies.length){ const found = search(n.replies); if(found) return found; }
    }
    return null;
  }
  return search(m.comments);
}
function renderCommentNode(momentId, c, depth){
  const canInteract = state.loggedIn;
  const avatarSize = depth===0 ? 26 : 22;
  const fontSize = depth===0 ? 11 : 10;
  return `<div class="comment-row">
    <span class="avatar" style="width:${avatarSize}px;height:${avatarSize}px;font-size:${fontSize}px;">${c.author[0]}</span>
    <div style="flex:1;min-width:0;">
      <div class="comment-bubble"><div class="c-author">${c.author}</div><div class="c-text">${c.text}</div><div class="c-time">${c.time}</div></div>
      <div class="c-actions">
        <button class="c-action ${c.likedByMe?'liked':''}" onclick="${canInteract?`toggleCommentLike(${momentId},${c.id})`:`toast('Log in to like comments.')`}">${c.likedByMe?'❤️':'🤍'} ${c.likes>0?c.likes:'Like'}</button>
        <button class="c-action" onclick="${canInteract?`toggleReplyForm(${momentId},${c.id})`:`toast('Log in to reply.')`}">↩ Reply</button>
      </div>
      ${(c.replies&&c.replies.length) ? `<div class="reply-list">${c.replies.map(r=>renderCommentNode(momentId,r,depth+1)).join('')}</div>` : ''}
      <div class="reply-form vh" id="rform-${momentId}-${c.id}">
        <input type="text" placeholder="Reply to ${c.author}…" id="rbox-${momentId}-${c.id}" onkeydown="if(event.key==='Enter'){submitReply(${momentId},${c.id});}">
        <button class="btn btn-primary btn-sm" onclick="submitReply(${momentId},${c.id})">Reply</button>
      </div>
    </div>
  </div>`;
}
function toggleReplyForm(momentId, nodeId){
  const form = document.getElementById(`rform-${momentId}-${nodeId}`);
  if(!form) return;
  form.classList.toggle('vh');
  if(!form.classList.contains('vh')){ const inp = document.getElementById(`rbox-${momentId}-${nodeId}`); if(inp) inp.focus(); }
}
function toggleMomentLike(momentId){
  const m = MOMENTS.find(x=>x.id===momentId); if(!m) return;
  m.likedByMe = !m.likedByMe;
  m.likes = (m.likes||0) + (m.likedByMe ? 1 : -1);
  renderMomentsFeed();
}
function toggleCommentLike(momentId, nodeId){
  const m = MOMENTS.find(x=>x.id===momentId); if(!m) return;
  const c = findCommentNode(m, nodeId); if(!c) return;
  c.likedByMe = !c.likedByMe;
  c.likes = (c.likes||0) + (c.likedByMe ? 1 : -1);
  renderMomentsFeed();
}
function submitComment(momentId){
  const input = document.getElementById('cbox-'+momentId);
  const text = input.value.trim();
  if(!text) return;
  const m = MOMENTS.find(x=>x.id===momentId);
  m.comments.push({id:Date.now()+Math.floor(Math.random()*1000), author:state.name, text, time:'just now', authorId:state.phone, likes:0, likedByMe:false, replies:[]});
  input.value='';
  renderMomentsFeed();
}
function submitReply(momentId, nodeId){
  const input = document.getElementById(`rbox-${momentId}-${nodeId}`);
  const text = input.value.trim();
  if(!text) return;
  const m = MOMENTS.find(x=>x.id===momentId); if(!m) return;
  const parent = findCommentNode(m, nodeId); if(!parent) return;
  if(!parent.replies) parent.replies = [];
  parent.replies.push({id:Date.now()+Math.floor(Math.random()*1000), author:state.name, text, time:'just now', authorId:state.phone, likes:0, likedByMe:false, replies:[]});
  input.value='';
  renderMomentsFeed();
}

/* ===================== PROFILE ===================== */
const TABS_BASE = [
  {id:'info', label:'My Profile', icon:'👤'},
  {id:'favorites', label:'Favorites', icon:'♡'},
  {id:'listings', label:'', icon:'📋'},
  {id:'orders', label:'My Orders', icon:'🧾', farmerOnly:true},
  {id:'moments', label:'My Moments', icon:'📣', farmerOnly:true},
  {id:'payouts', label:'Payouts', icon:'💰', farmerOnly:true},
  {id:'comments', label:'My Comments', icon:'💬'},
  {id:'verification', label:'Verification', icon:'🛡️', farmerOnly:true}
];
function renderProfile(){
  document.getElementById('profileAvatar').innerHTML = avatarInnerHTML(state.avatar, state.name);
  document.getElementById('profileName').textContent = state.name;
  document.getElementById('profileRoleLine').textContent = (state.role==='farmer' ? '🌾 Farmer / Seller' : '🛒 Buyer') + (state.email ? ' · '+state.email : '');
  const vEl = document.getElementById('profileVStatus');
  if(state.role==='farmer'){ vEl.style.display='inline-flex'; setStatusPill(vEl, state.verification.status); } else { vEl.style.display='none'; }

  document.getElementById('listingsTitle').textContent = state.role==='farmer' ? 'My Listings' : 'My Orders';
  document.getElementById('listingsDesc').textContent = state.role==='farmer'
    ? 'Active, pending, and rejected listings, with the reason shown.'
    : 'Your active and past orders. This is private and only visible to you.';
  document.getElementById('addListingBtn').style.display = state.role==='farmer' ? 'inline-flex' : 'none';

  const tabs = TABS_BASE.filter(t=> !t.farmerOnly || state.role==='farmer').map(t=>{
    if(t.id==='listings') t.label = state.role==='farmer' ? 'My Listings' : 'My Orders';
    return t;
  });
  document.getElementById('profileTabs').innerHTML = tabs.map((t,i)=>{
    let badge='';
    if(t.id==='verification' && state.verification.status==='pending') badge='<span class="tab-badge">pending</span>';
    return `<button class="profile-tab ${i===0?'active':''}" data-tab="${t.id}" onclick="switchProfileTab('${t.id}')">${t.icon} ${t.label}${badge}</button>`;
  }).join('');

  fillInfoFields();
  document.getElementById('avatarThumb').innerHTML = `<input type="file" accept="image/*" class="vh" id="avatarInput" onchange="handleAvatarUpload(event)">` + thumbHTML(state.avatar, '#F1F5EA', true, 'Add photo');
  setEditMode(state.editingInfo);

  renderFavorites();
  renderListings();
  renderFarmerOrders();
  renderMomentsTab();
  renderPayouts();
  renderMyComments();
  renderVerification();
  switchProfileTab('info');
}
function fillInfoFields(){
  document.getElementById('info-name').value = state.name;
  document.getElementById('info-phone').value = state.phone;
  document.getElementById('info-email').value = state.email || '—';
  document.getElementById('info-role').value = state.role==='farmer' ? 'Farmer / Seller' : 'Buyer';
  document.getElementById('info-location-wrap').style.display = state.role==='farmer' ? 'block' : 'none';
  document.getElementById('info-bio-wrap').style.display = state.role==='farmer' ? 'block' : 'none';
  document.getElementById('info-location').value = state.location;
  document.getElementById('info-bio').value = state.bio;
}
function toggleEditInfo(){ setEditMode(!state.editingInfo); }
function setEditMode(on){
  state.editingInfo = on;
  ['info-name','info-phone','info-location','info-bio'].forEach(id=>{
    const el = document.getElementById(id); if(el) el.readOnly = !on;
  });
  document.getElementById('saveInfoBtn').style.display = on ? 'inline-flex' : 'none';
  document.getElementById('editToggleBtn').textContent = on ? 'Cancel' : 'Edit profile';
  document.getElementById('editToggleBtn').onclick = on ? ()=>{ setEditMode(false); fillInfoFields(); } : toggleEditInfo;
}
function handleAvatarUpload(e){
  const file = e.target.files[0]; if(!file) return;
  e.target.value='';
  openCropModal(file, url=>{
    state.avatar = url;
    if(state.role==='farmer'){ ensureMyFarmerRecord(); }
    document.getElementById('avatarThumb').innerHTML = `<input type="file" accept="image/*" class="vh" id="avatarInput" onchange="handleAvatarUpload(event)">` + thumbHTML(state.avatar, '#F1F5EA', true, 'Add photo');
    document.getElementById('profileAvatar').innerHTML = avatarInnerHTML(state.avatar, state.name);
    renderAuthArea();
    toast('Profile photo updated.');
  }, 'circle');
}
function saveProfileInfo(){
  state.name = document.getElementById('info-name').value.trim() || state.name;
  state.phone = document.getElementById('info-phone').value.trim() || state.phone;
  state.location = document.getElementById('info-location').value.trim();
  state.bio = document.getElementById('info-bio').value.trim();
  if(state.role==='farmer') ensureMyFarmerRecord();
  setEditMode(false);
  document.getElementById('profileName').textContent = state.name;
  renderAuthArea();
  toast('Profile updated.');
}
function setStatusPill(el, status){
  el.className='v-status '+status;
  el.textContent = status==='verified' ? '✓ Verified Farmer' : status==='pending' ? '⏳ Verification Pending' : '● Not Verified';
}
function switchProfileTab(id){
  document.querySelectorAll('.profile-tab').forEach(b=>b.classList.toggle('active', b.dataset.tab===id));
  document.querySelectorAll('.profile-panel').forEach(p=>p.classList.remove('active'));
  document.getElementById('panel-'+id).classList.add('active');
}
function renderFavorites(){
  const el = document.getElementById('favList');
  if(!state.favorites.size){ el.innerHTML = `<div class="fav-empty"><div class="ic">♡</div>Nothing saved yet — tap Save on any product to add it here.</div>`; return; }
  el.innerHTML = [...state.favorites].map(id=>{
    const p = PRODUCTS.find(x=>x.id===id);
    if(!p) return '';
    return `<div class="mylist-row"><div class="mylist-left"><div class="mylist-thumb thumb">${thumbHTML(p.image,p.color,false)}</div>
      <div><div class="mylist-name">${p.name}</div><div class="mylist-sub">${farmerName(p.farmerId)} · ${p.price} XAF/${p.unit}</div></div></div>
      <button class="btn btn-sm btn-outline" onclick="openProduct(${p.id})">View</button></div>`;
  }).join('');
}
function renderListings(){
  const el = document.getElementById('listingsList');
  if(state.role==='farmer'){
    const mine = PRODUCTS.filter(p=>p.farmerId===state.phone);
    if(!mine.length){ el.innerHTML = `<div class="gen-empty"><div class="ic">📋</div>You haven't listed any products yet.</div>`; return; }
    el.innerHTML = mine.map(p=>{
      const statusLabel = p.status==='live' ? 'Live' : p.status==='pending' ? 'Pending review' : 'Rejected';
      const cls = p.status==='live' ? 'live' : p.status==='pending' ? 'review' : 'rejected';
      return `<div class="mylist-row"><div class="mylist-left"><div class="mylist-thumb thumb">${thumbHTML(p.image,p.color,false)}</div>
        <div><div class="mylist-name">${p.name}</div><div class="mylist-sub">${p.price} XAF/${p.unit}</div></div></div>
        <div class="mylist-right"><span class="status-tag ${cls}">${statusLabel}</span><button class="btn btn-sm btn-danger" onclick="removeListing(${p.id})">Remove</button></div></div>`;
    }).join('');
  }else{
    if(!state.orders.length){ el.innerHTML = `<div class="gen-empty"><div class="ic">📋</div>No orders yet — visit the marketplace to place one.</div>`; return; }
    el.innerHTML = state.orders.map(d=>{
      const statusLabel = d.status==='delivered' ? 'Delivered ✓' : d.status==='out_for_delivery' ? 'Out for delivery' : d.status==='review' ? 'Under review' : 'Rejected';
      const cls = d.status==='delivered' ? 'live' : d.status==='out_for_delivery' ? 'review' : d.status==='review' ? 'review' : 'rejected';
      return `<div class="mylist-row"><div class="mylist-left"><div class="mylist-thumb thumb">${thumbHTML(null,'#F3E9D6',false)}</div>
        <div><div class="mylist-name">${d.name}</div><div class="mylist-sub">${d.unit?'Sold by the '+d.unit:''}${d.note?' · '+d.note:''}</div></div></div>
        <div class="mylist-right"><span class="status-tag ${cls}">${statusLabel}</span>${d.status==='out_for_delivery' ? `<button class="btn btn-primary btn-sm" onclick="confirmDelivery(${d.id})">Confirm delivery received</button>` : ''}</div></div>`;
    }).join('');
  }
}
function removeListing(id){
  PRODUCTS = PRODUCTS.filter(p=>p.id!==id);
  renderListings(); renderMarketplace(); renderHomePanel(); renderTicker();
  toast('Listing removed.');
}
function renderFarmerOrders(){
  const el = document.getElementById('farmerOrdersList');
  if(!el || state.role!=='farmer') return;
  const mine = SALES.filter(s=>s.farmerId===state.phone);
  if(!mine.length){ el.innerHTML = `<div class="gen-empty"><div class="ic">🧾</div>No orders yet. Orders will appear here as soon as a buyer purchases one of your listings.</div>`; return; }
  el.innerHTML = mine.map(s=>{
    const delivered = s.status==='delivered';
    const statusLabel = delivered ? 'Delivered ✓' : 'Out for delivery';
    const cls = delivered ? 'live' : 'review';
    return `<div class="mylist-row"><div class="mylist-left"><div class="mylist-thumb thumb">${thumbHTML(null,'#F1F5EA',false)}</div>
      <div><div class="mylist-name">${s.productName} <span style="font-weight:400;color:var(--ink-soft);">× ${s.qty}</span></div>
      <div class="mylist-sub">Order ${s.orderRef} · Buyer: ${s.buyerName}</div></div></div>
      <div class="mylist-right"><span class="status-tag ${cls}">${statusLabel}</span>${!delivered ? `<button class="btn btn-primary btn-sm" onclick="farmerConfirmDelivery(${s.id})">Confirm delivery</button>` : ''}</div></div>`;
  }).join('');
}
function renderPayouts(){
  const summaryEl = document.getElementById('payoutsSummary');
  const listEl = document.getElementById('payoutsList');
  if(!summaryEl || !listEl) return;
  if(state.role!=='farmer'){ return; }
  const mine = SALES.filter(s=>s.farmerId===state.phone);
  if(!mine.length){
    summaryEl.innerHTML='';
    listEl.innerHTML = `<div class="gen-empty"><div class="ic">💰</div>No sales yet. Payouts appear here once a buyer orders one of your listings.</div>`;
    return;
  }
  const totalGross = mine.reduce((a,s)=>a+s.gross,0);
  const totalCommission = mine.reduce((a,s)=>a+s.commission,0);
  const totalNet = mine.reduce((a,s)=>a+s.net,0);
  const pendingCount = mine.filter(s=>s.status!=='delivered').length;
  summaryEl.innerHTML = `
    <div class="signal-card"><div style="font-size:11px;color:var(--ink-soft);">Total sales</div><div style="font-size:19px;font-weight:800;">${totalGross.toLocaleString()} XAF</div></div>
    <div class="signal-card"><div style="font-size:11px;color:var(--ink-soft);">Platform fee (10%)</div><div style="font-size:19px;font-weight:800;color:var(--down);">-${totalCommission.toLocaleString()} XAF</div></div>
    <div class="signal-card" style="border-color:var(--up);"><div style="font-size:11px;color:var(--ink-soft);">Your payout</div><div style="font-size:19px;font-weight:800;color:var(--up);">${totalNet.toLocaleString()} XAF</div></div>`;
  listEl.innerHTML = `<div style="font-size:11.5px;color:var(--ink-soft);margin-bottom:8px;">${pendingCount} sale${pendingCount===1?'':'s'} awaiting delivery confirmation before payout is released.</div>` +
    mine.map(s=>{
      const delivered = s.status==='delivered';
      return `<div class="mylist-row"><div class="mylist-left"><div class="mylist-thumb thumb">${thumbHTML(null,'#F1F5EA',false)}</div>
        <div><div class="mylist-name">${s.productName} <span style="font-weight:400;color:var(--ink-soft);">× ${s.qty}</span></div>
        <div class="mylist-sub">Sold to ${s.buyerName} · Gross ${s.gross.toLocaleString()} XAF − 10% fee ${s.commission.toLocaleString()} = <b style="color:var(--ink);">${s.net.toLocaleString()} XAF net</b></div></div></div>
        <span class="status-tag ${delivered?'live':'review'}">${delivered?'Paid out':'Pending delivery'}</span></div>`;
    }).join('');
}
function renderMomentsTab(){
  const el = document.getElementById('momentsList');
  if(state.role!=='farmer'){ el.innerHTML = `<div class="gen-empty"><div class="ic">📣</div>Moments are a farmer feature.</div>`; return; }
  const mine = MOMENTS.filter(m=>m.farmerId===state.phone);
  if(!mine.length){ el.innerHTML = `<div class="gen-empty"><div class="ic">📣</div>You haven't posted a Moment yet. Try the Social tab.</div>`; return; }
  el.innerHTML = mine.map(m=> m.editing ? `<div class="moment-card mini">
      <textarea id="edit-moment-${m.id}" style="width:100%;min-height:70px;font-family:inherit;font-size:13px;border:1px solid var(--line);border-radius:10px;padding:8px 10px;">${m.text}</textarea>
      <div style="margin-top:8px;display:flex;gap:8px;">
        <button class="btn btn-primary btn-sm" onclick="saveMomentEdit(${m.id})">Save</button>
        <button class="btn btn-secondary btn-sm" onclick="cancelMomentEdit(${m.id})">Cancel</button>
      </div>
    </div>` : `<div class="moment-card mini"><p>${m.text}</p><div class="moment-meta" style="font-size:11.5px;color:var(--ink-soft);">${m.time} · ${countAllComments(m)} comment${countAllComments(m)===1?'':'s'} · ❤️ ${m.likes||0}
    <button class="cart-remove" style="margin-left:10px;" onclick="startMomentEdit(${m.id})">Edit</button>
    <button class="cart-remove" style="margin-left:10px;" onclick="deleteMoment(${m.id})">Delete</button></div></div>`).join('');
}
function startMomentEdit(id){ const m=MOMENTS.find(x=>x.id===id); if(m){ m.editing=true; renderMomentsTab(); } }
function cancelMomentEdit(id){ const m=MOMENTS.find(x=>x.id===id); if(m){ m.editing=false; renderMomentsTab(); } }
function saveMomentEdit(id){
  const m = MOMENTS.find(x=>x.id===id); if(!m) return;
  const val = document.getElementById('edit-moment-'+id).value.trim();
  if(!val){ toast('Moment text cannot be empty.'); return; }
  m.text = val; m.editing = false;
  renderMomentsTab(); renderMomentsFeed();
  toast('Moment updated.');
}
function deleteMoment(id){ MOMENTS = MOMENTS.filter(m=>m.id!==id); renderMomentsTab(); toast('Moment deleted.'); }
function renderMyComments(){
  const el = document.getElementById('myCommentsList');
  const mine = [];
  MOMENTS.forEach(m=>{ m.comments.forEach(c=>{ if(c.authorId===state.phone) mine.push({moment:m, comment:c}); }); });
  if(!mine.length){ el.innerHTML = `<div class="gen-empty"><div class="ic">💬</div>No comments yet — visit the Social tab to leave one.</div>`; return; }
  el.innerHTML = mine.map(({moment,comment})=>`<div class="mylist-row"><div><div class="mylist-name">"${comment.text}"</div><div class="mylist-sub">On ${farmerName(moment.farmerId)}'s Moment · ${comment.time}</div></div>
    <button class="btn btn-sm btn-outline" onclick="go('social')">View</button></div>`).join('');
}

/* ===================== VERIFICATION (farmer only) ===================== */
function renderVerification(){
  const el = document.getElementById('verificationBody');
  const v = state.verification;
  if(state.role!=='farmer'){ el.innerHTML = `<div class="gate-card">🛡️ Identity verification is only required for farmer accounts.<br>Buyer accounts don't need to verify.</div>`; return; }
  if(v.status==='verified'){
    el.innerHTML = `<div class="status-panel verified"><h3>✓ You're a Verified Farmer</h3>
      <p>Your ID, live selfie match, and proof of farm ownership have all been confirmed. Your listings now carry the Verified badge, and buyers can see your trust status on your public profile.</p></div>`;
    return;
  }
  if(v.status==='pending'){
    el.innerHTML = `<div class="status-panel pending"><h3>⏳ Verification pending review</h3>
      <p>Your documents were submitted and are being reviewed. This typically takes 24–48 hours, and we'll notify you by SMS once it's done.</p>
      <ul class="checklist" style="margin-top:16px;">
        <li>✅ National ID card uploaded</li><li>✅ Live selfie submitted for photo match</li>
        <li>✅ Proof of farm / produce ownership uploaded</li><li>✅ Digital contract accepted</li>
      </ul></div>`;
    return;
  }
  const step = v.step;
  const stepLabels = ['ID card','Selfie match','Proof of farm','Contract & submit'];
  let stepsHtml = stepLabels.map((lbl,i)=>{
    const n=i+1; const cls = n<step ? 'done' : n===step ? 'current' : '';
    return `<div class="v-step ${cls}"><div class="dot">${n<step?'✓':n}</div><span>${lbl}</span></div>` + (i<stepLabels.length-1 ? `<div class="v-step-sep ${n<step?'done':''}"></div>` : '');
  }).join('');
  const introBanner = `<div class="verify-intro"><span class="ic">🛡️</span><p><b>Why we verify farmers.</b> A quick ${stepLabels.length}-step check confirms you're a real person with real produce to sell, so buyers can trust every listing on Theraprice. Takes about 5 minutes.</p></div>`;
  let content='';
  if(step===1){
    content = `<h3>Step 1 — National ID card</h3><p class="desc">Upload a clear photo of your national ID card. This confirms your account belongs to a real, identifiable person.</p>
      <label class="upload-box ${v.files.id?'attached':''}" for="file-id"><div class="ic">🪪</div><div><b>${v.files.id?'ID card uploaded':'Tap to upload ID card photo'}</b></div><div style="font-size:11.5px;margin-top:4px;">JPG or PNG, front side visible</div>
      <div class="fname" id="fname-id">${v.files.id ? '✓ ID card attached' : ''}</div></label>
      <input type="file" id="file-id" accept="image/*" class="vh" onchange="markFile('id')">
      <div class="step-actions"><span></span><button class="btn btn-primary" onclick="verStepNext(1)" ${v.files.id?'':'disabled'}>Continue</button></div>`;
  }else if(step===2){
    content = `<h3>Step 2 — Live selfie match</h3><p class="desc">Take a live selfie so we can confirm the person holding the phone matches the ID card photo.</p>
      <label class="upload-box ${v.files.selfie?'attached':''}" for="file-selfie"><div class="ic">🤳</div><div><b>${v.files.selfie?'Selfie uploaded':'Tap to take/upload a live selfie'}</b></div><div style="font-size:11.5px;margin-top:4px;">Good lighting, face clearly visible</div>
      <div class="fname" id="fname-selfie">${v.files.selfie ? '✓ Selfie attached' : ''}</div></label>
      <input type="file" id="file-selfie" accept="image/*" capture="user" class="vh" onchange="markFile('selfie')">
      <div class="step-actions"><button class="btn btn-outline" onclick="verStepBack()">Back</button><button class="btn btn-primary" onclick="verStepNext(2)" ${v.files.selfie?'':'disabled'}>Continue</button></div>`;
  }else if(step===3){
    content = `<h3>Step 3 — Proof of farm or produce ownership</h3><p class="desc">Upload a photo or document showing you genuinely have produce or farmland to sell.</p>
      <label class="upload-box ${v.files.proof?'attached':''}" for="file-proof"><div class="ic">🌾</div><div><b>${v.files.proof?'Proof uploaded':'Tap to upload proof of ownership'}</b></div><div style="font-size:11.5px;margin-top:4px;">Land title, cooperative letter, or a farm photo</div>
      <div class="fname" id="fname-proof">${v.files.proof ? '✓ Proof attached' : ''}</div></label>
      <input type="file" id="file-proof" accept="image/*,.pdf" class="vh" onchange="markFile('proof')">
      <div class="step-actions"><button class="btn btn-outline" onclick="verStepBack()">Back</button><button class="btn btn-primary" onclick="verStepNext(3)" ${v.files.proof?'':'disabled'}>Continue</button></div>`;
  }else if(step===4){
    content = `<h3>Step 4 — Digital contract &amp; consent</h3><p class="desc">The last step before your application goes to review.</p>
      <div class="check-row"><input type="checkbox" id="chk-contract" onchange="toggleConsent('contract')" ${v.contract?'checked':''}>
        <label for="chk-contract">I accept the Theraprice farmer digital contract. I understand fraudulent listings or scam behavior can result in account suspension.</label></div>
      <div class="check-row"><input type="checkbox" id="chk-locator" onchange="toggleConsent('locator')" ${v.locator?'checked':''}>
        <label for="chk-locator">(Optional) Enable consent-based device location, so Theraprice can help trace stolen goods or resolve confirmed fraud cases. I can review this anytime.</label></div>
      <div class="step-actions"><button class="btn btn-outline" onclick="verStepBack()">Back</button><button class="btn btn-primary" onclick="submitVerification()" ${v.contract?'':'disabled'}>Submit for review</button></div>`;
  }
  el.innerHTML = `<h3 style="margin-bottom:2px;">Farmer Verification</h3><p class="desc">Every farmer account is verified before its listings go live, so buyers can trust every listing on Theraprice.</p>
    ${introBanner}<div class="v-steps">${stepsHtml}</div>${content}`;
}
function markFile(kind){ state.verification.files[kind] = true; renderVerification(); toast('File attached.'); }
function toggleConsent(kind){ state.verification[kind] = !state.verification[kind]; }
function verStepNext(current){ state.verification.step = current+1; renderVerification(); }
function verStepBack(){ state.verification.step = Math.max(1, state.verification.step-1); renderVerification(); }
function submitVerification(){
  state.verification.status='pending';
  renderVerification(); renderProfile();
  toast('Verification submitted for review.');
  setTimeout(()=>{
    state.verification.status='verified';
    ensureMyFarmerRecord();
    PRODUCTS.filter(p=>p.farmerId===state.phone && p.status==='pending').forEach(p=>p.status='live');
    renderVerification(); renderProfile(); renderMarketplace(); renderHomePanel(); renderTicker(); renderListings();
    toast("You're now a Verified Farmer — your pending listings are live.");
  }, 4500);
}

/* ===================== NEW LISTING (farmer posts a product) ===================== */
function openListingForm(){
  if(!state.loggedIn || state.role!=='farmer'){ toast('Log in as a farmer to list a product.'); go('login'); return; }
  document.getElementById('listingModalSub').textContent = farmerVerified(state.phone)
    ? "Add produce to the marketplace. As a verified farmer, this publishes immediately."
    : "Add produce to the marketplace. It will stay pending until your farmer identity is verified.";
  document.getElementById('ln-name').value='';
  document.getElementById('ln-unit').value='';
  document.getElementById('ln-price').value='';
  document.getElementById('ln-desc').value='';
  state.listingDraftImage=null;
  document.getElementById('listingThumbPicker').innerHTML = `<input type="file" accept="image/*" class="vh" id="listingImageInput" onchange="handleListingImageUpload(event)">` + thumbHTML(null,'#F1F5EA',true,'Add product photo');
  document.getElementById('listingModal').classList.add('open');
}
function closeListingForm(){ document.getElementById('listingModal').classList.remove('open'); }
function handleListingImageUpload(e){
  const file = e.target.files[0]; if(!file) return;
  readFileAsDataURL(file, url=>{
    state.listingDraftImage = url;
    document.getElementById('listingThumbPicker').innerHTML = `<input type="file" accept="image/*" class="vh" id="listingImageInput" onchange="handleListingImageUpload(event)">` + thumbHTML(url,'#F1F5EA',true,'Add product photo');
  });
}
function submitListing(){
  const name = document.getElementById('ln-name').value.trim();
  const category = document.getElementById('ln-category').value;
  const unit = document.getElementById('ln-unit').value.trim();
  const price = Number(document.getElementById('ln-price').value);
  const desc = document.getElementById('ln-desc').value.trim();
  if(!name || !unit || !price){ toast('Fill in the product name, unit, and price.'); return; }
  ensureMyFarmerRecord();
  const status = farmerVerified(state.phone) ? 'live' : 'pending';
  const palette = ['#F4D9CE','#EBD9E8','#F2E7B8','#F5E7B0','#E8DCC8','#F2ECD8','#E4D3C6','#EFE1CC'];
  PRODUCTS.push({
    id: Date.now(), name, category, color: palette[Math.floor(Math.random()*palette.length)], image: state.listingDraftImage,
    price, unit, farmerId:state.phone, status, trend:'flat', prob:0, tier:'low', range:null, mid:null,
    desc: desc || `${name}, listed by ${state.name}.`,
    why:{supply:'New listing — not enough history yet', season:'To be determined', weather:'To be determined', demand:'To be determined'}
  });
  closeListingForm();
  renderListings(); renderMarketplace(); renderHomePanel(); renderTicker();
  toast(status==='live' ? 'Product listed and live on the marketplace.' : 'Product submitted — it will go live once your account is verified.');
}

/* ===================== INIT ===================== */
function init(){
  applyLanguage();
  renderTicker();
  renderHomePanel();
  renderAuthArea();
  renderFilters();
  renderMarketplace();
  document.querySelector('nav.primary a[data-view="home"]').classList.add('active');
  document.getElementById('alertModal').addEventListener('click', e=>{ if(e.target.id==='alertModal') closeAlertModal(); });
  document.getElementById('listingModal').addEventListener('click', e=>{ if(e.target.id==='listingModal') closeListingForm(); });
  document.getElementById('cropModal').addEventListener('click', e=>{ if(e.target.id==='cropModal') cancelCrop(); });
  document.addEventListener('keydown', e=>{ if(e.key==='Escape'){ closeAlertModal(); closeListingForm(); } });
  const cropImg = document.getElementById('cropImg');
  cropImg.addEventListener('mousedown', cropPointerDown);
  cropImg.addEventListener('touchstart', cropPointerDown, {passive:true});
  document.addEventListener('mousemove', cropPointerMove);
  document.addEventListener('touchmove', cropPointerMove, {passive:false});
  document.addEventListener('mouseup', cropPointerUp);
  document.addEventListener('touchend', cropPointerUp);
}
init();
