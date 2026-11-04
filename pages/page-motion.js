(function(){
 if(!window.gsap || matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const g=window.gsap;
 const hero=document.querySelector('.hero');
 g.timeline().from(hero.querySelector('.photo'),{scale:1.07,opacity:0,duration:1.3,ease:'power3.out'}).from(hero.querySelector('.copy'),{y:50,opacity:0,duration:1,ease:'power3.out'},.2);
 document.querySelectorAll('[data-slide]').forEach(button=>button.addEventListener('click',()=>g.fromTo(hero.querySelector('.photo'),{opacity:.25,scale:1.05},{opacity:1,scale:1,duration:.8,ease:'power2.out'})));
 document.querySelectorAll('[data-view]').forEach(button=>button.addEventListener('click',()=>g.fromTo(document.querySelector('.wide'),{opacity:.3},{opacity:1,duration:.65})));
 const targets=document.querySelectorAll('.intro h2,.grid article,.showcase');
 const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){g.from(entry.target,{y:35,opacity:0,duration:.85,ease:'power3.out'});observer.unobserve(entry.target);}}),{threshold:.1});targets.forEach(el=>observer.observe(el));
})();
