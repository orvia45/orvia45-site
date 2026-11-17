/* Historique public : afficher uniquement les retraits réellement confirmés comme payés. */
(()=>{
 const host=document.getElementById('withdrawal-records');
 if(!host)return;
 const formatAmount=value=>Number(value).toLocaleString('fr-FR');
 const showEmpty=()=>{const empty=document.createElement('p');empty.className='records-empty';empty.textContent='Les retraits confirmés apparaîtront ici.';host.replaceChildren(empty)};
 const render=records=>{if(!records.length){showEmpty();return}const track=document.createElement('div');track.className='withdrawal-track';for(let repeat=0;repeat<2;repeat++)records.forEach(r=>{const item=document.createElement('div');item.className='record-item';const label=document.createTextNode('Retrait confirmé : ');const phone=document.createElement('strong');phone.textContent=r.phone;const amount=document.createElement('strong');amount.textContent=` — ${formatAmount(r.amount)} FCFA`;item.append(label,phone,amount);track.append(item)});host.replaceChildren(track);host.setAttribute('aria-label','Retraits confirmés, numéros masqués, défilement continu')};
 fetch('/api/public/withdrawal-records',{headers:{Accept:'application/json'}}).then(r=>{if(!r.ok)throw new Error('Historique indisponible');return r.json()}).then(d=>render(Array.isArray(d.records)?d.records:[])).catch(showEmpty);
})();
