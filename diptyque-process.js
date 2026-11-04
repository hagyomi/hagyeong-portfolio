(() => {
  const dialog=document.querySelector('#diptyqueLightbox');
  if(!dialog)return;
  const image=dialog.querySelector('img');
  const title=dialog.querySelector('h2');
  const zoom=dialog.querySelector('[data-zoom]');
  let sources=[];
  fetch('images/zara-methodology/sources.json').then(r=>r.json()).then(data=>{sources=data;}).catch(()=>{});
  document.querySelectorAll('.diptyque-process-stage').forEach(stage=>{
    const preview=stage.querySelector('.diptyque-preview img');
    const caption=stage.querySelector('.diptyque-material-caption');
    stage.querySelectorAll('[data-material]').forEach(button=>button.addEventListener('click',()=>{
      stage.querySelectorAll('[data-material]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
      preview.src=`images/zara-methodology/${button.dataset.material}.png`;
      preview.alt=`ZARA 가상 리뉴얼 ${button.textContent} 포트폴리오 예시 자료`;
      caption.firstChild.textContent=button.textContent+' ';
      stage.querySelector('.diptyque-preview').setAttribute('aria-label',button.textContent+' 크게 보기');
    }));
    stage.querySelector('.diptyque-preview').addEventListener('click',()=>{
      const selected=stage.querySelector('[aria-pressed=true]');
      image.src=preview.src;image.alt=preview.alt;title.textContent=selected.textContent;
      dialog.classList.remove('is-zoomed');zoom.textContent='확대 +';dialog.showModal();
    });
  });
  dialog.querySelector('[data-close]').addEventListener('click',()=>dialog.close());
  zoom.addEventListener('click',()=>{const enlarged=dialog.classList.toggle('is-zoomed');zoom.textContent=enlarged?'축소 −':'확대 +';});
  dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
})();
