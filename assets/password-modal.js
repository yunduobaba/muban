document.addEventListener('DOMContentLoaded', function(){
  const password_modal = document.querySelector('[type="password"][aria-invalid="true"]');
  if(password_modal){
    const modal = document.querySelector('[data-modal="modal-password"]');
    if(modal) modal.open();
  }
});