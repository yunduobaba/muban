class CartInventoryOrganizer extends HTMLElement {
  constructor() {
    super();
  }
  
  getPurposalDetails(id){
    this.data = this.querySelector('[type="application/json"]');
    this.data = JSON.parse(this.data.textContent);
    
    const itemsArr = this.data.items;
    return itemsArr.find(detailsArr => {
      if(detailsArr.id === id){
        return detailsArr.id === id;
      }
    });
  }
  
  setCartUpdates(qty, selector = null){
    if(!selector) return;
    
    const elemParent = selector.parentElement;
    
    if(qty > 0){
      elemParent.classList.remove('visually-hidden');
    
    } else{
      elemParent.classList.add('visually-hidden');
    }
    
    selector.textContent = qty;
  }
  
  updateBubbleStatus(){
    const bubbles = document.querySelectorAll('[data-cart-organizer-bubble]');
    if(!bubbles) return;
    
    this.data = this.querySelector('[type="application/json"]');
    this.data = JSON.parse(this.data.textContent);
    const regex = /\d+/;
    
    if(bubbles){
      bubbles.forEach(bubble => {
        if(bubble.getAttribute('data-cart-organizer-bubble') === 'noclass'){
          if(this.data.item_count === 1){
            bubble.innerText = window.accessibilityStrings.inCartOne.replace('[cart_count]', this.data.item_count);
          
          } else if(this.data.item_count > 1){
            bubble.innerText = window.accessibilityStrings.inCartOther.replace('[cart_count]', this.data.item_count);
          
          } else{
            bubble.innerText = window.accessibilityStrings.inCartZero;
          }
        
        } else{
          bubble.innerText = this.data.item_count;
        
          if(this.data.item_count > 0){
            bubble.classList.remove('visually-hidden');
          
          } else{
            bubble.classList.add('visually-hidden');
          }
        }
      });
    }
  }
}
customElements.define('cart-inventory-organizer', CartInventoryOrganizer);

class CartItemRow extends HTMLElement {
  constructor() {
    super();
    
    this.udpateElements = {
      mainCartItems: document.querySelector('.main-cart_items-wrap'),
      mainCartTotals: document.querySelector('[data-contents="cart-total-price"]'),
      mainCartShipmentBar: document.querySelector('[data-contents="cart-shipment-bar"]'),
      mainMinValueCheck: document.querySelector('[data-contents="main-cart-min-value-check"]'),
      drawerMinValueCheck: document.querySelector('[data-contents="drawer-min-value-check"]')
    }
    
    this.staticSelectors = {
      mcItems: '.main-cart_items-wrap',
      mcTotals: '[data-contents="cart-total-price"]',
      mcShipBar: '[data-contents="cart-shipment-bar"]',
      mainMinValue: '[data-contents="main-cart-min-value-check"]',
      drawerMinValue: '[data-contents="drawer-min-value-check"]'
    }
    
    this.quantityInput = this.querySelector('quantity-input');
    this.itemRemover = this.querySelector('.cart-item--remove');
    this.input = this.quantityInput.querySelector('input');
    this.initValue = this.input.value;
    this.productCard = document.querySelectorAll('product-card');
    this.cartInventoryOrganizer = document.querySelector('cart-inventory-organizer');
    
    this.quantityInput.addEventListener('change', this.setCartFetchUpdates.bind(this));
    this.itemRemover.addEventListener('click', this.setCartFetchUpdates.bind(this));
  }
  
  setCartFetchUpdates(event){
    const itemId = this.dataset.id;
    const qtySet = this.input.value;
    
    if(event.target === this.itemRemover || parseInt(qtySet) < 1){
      if(event.target === this.itemRemover) event.preventDefault();
      
      const qtyOffset = 0;
      this.setRenderChanges(itemId, qtyOffset);
      
      return;
    }
    
    this.setRenderChanges(itemId, qtySet);
  }
  
  setRenderChanges(line, quantity, replaceCart = false){
    this.showLoader(true);
    
    var body = JSON.stringify({
      line,
      quantity,
      sections: this.getSectionsToRender().map((section) => section.section),
      sections_url: window.location.pathname
    });
    
    if(this.dataset.mainCart === 'true'){
      body = JSON.stringify({
        line,
        quantity,
        sections: this.getCartToRender().map((section) => section.section),
        sections_url: window.location.pathname
      });
    }
    
    fetch(`${routes.cart_change_url}`, { ...fetchConfig(), ...{ body } })
    .then((response) => {
      return response.text();
    })
    .then((state) => {
      const parsedState = JSON.parse(state);
      this.errors = false;
      this.handleErrors(parsedState);
      const minCartElem = document.querySelectorAll('checkout-min');
      if(minCartElem.length > 0){
        minCartElem.forEach(checkoutMin => {
          checkoutMin.removeListener();
        });
      }
      if(!this.errors){
        if(this.dataset.mainCart === 'true'){
          if(replaceCart){
            this.getCartToRender().forEach((section => {
              const sectionElement = section.selector ? document.querySelector(section.selector) : document.getElementById(section.id);
              sectionElement.innerHTML =
                  this.getSectionInnerHTML(parsedState.sections[section.id], section.selector);
            }));
            
            return;
          }
          if(parsedState.item_count < 1){
            this.getCartToRender().forEach((section => {
              const sectionElement = section.selector ? document.querySelector(section.selector) : document.getElementById(section.id);
              sectionElement.innerHTML =
                  this.getSectionInnerHTML(parsedState.sections[section.id], section.selector);
            }));
          } else{
            const html = new DOMParser().parseFromString(parsedState.sections['main-cart'], 'text/html');
            if(this.udpateElements.mainCartItems) this.setSectionRenderChanges(html, this.staticSelectors.mcItems, this.udpateElements.mainCartItems);
            if(this.udpateElements.mainCartTotals) this.setSectionRenderChanges(html, this.staticSelectors.mcTotals, this.udpateElements.mainCartTotals);
            if(this.udpateElements.mainCartShipmentBar) this.setSectionRenderChanges(html, this.staticSelectors.mcShipBar, this.udpateElements.mainCartShipmentBar);
            if(this.udpateElements.mainMinValueCheck) this.setSectionRenderChanges(html, this.staticSelectors.mainMinValue, this.udpateElements.mainMinValueCheck);
            
            this.getCartToRender().forEach((section => {
              if(section.section === 'main-cart') return;
              
              const sectionElement = section.selector ? document.querySelector(section.selector) : document.getElementById(section.id);
              sectionElement.innerHTML =
                  this.getSectionInnerHTML(parsedState.sections[section.id], section.selector);
            }));
          }
        
        } else{
          this.getSectionsToRender().forEach((section => {
            const sectionElement = section.selector ? document.querySelector(section.selector) : document.getElementById(section.id);
            sectionElement.innerHTML =
                this.getSectionInnerHTML(parsedState.sections[section.id], section.selector);
          }));
        }
      }
      
      // publish(PUB_SUB_EVENTS.cartUpdate, {source: 'cart-items'});
    }).catch(() => {
      // console.error(e);
    })
    .finally(() => {
      this.initValue = this.input.value;
      
      if(!this.errors){
        if(this.productCard && this.productCard.length > 0){
          this.productCardsQtyUpdates(this.dataset.variantId);
        }
        
        this.cartInventoryOrganizer.updateBubbleStatus();
      }
      
      this.showLoader(false);
      const drawer = document.querySelector('[data-modal="modal-cart-drawer"]');
      if(drawer) trapFocus(drawer.content);
      const shippingBar = document.querySelectorAll('shipping-bar');
      if(shippingBar){
        shippingBar.forEach(bar => {
          bar.setString();
        });
      }
      const minCartElem = document.querySelectorAll('checkout-min');
      if(minCartElem.length > 0){
        minCartElem.forEach(checkoutMin => {
          checkoutMin.onCheck();
          checkoutMin.initialize();
        });
      }
    });
  }
  
  showLoader(arg){
    const hasLoader = this.querySelector('.--loader');
    if(hasLoader){
      arg ? this.classList.add('--show-loader') : this.classList.remove('--show-loader');
    }
    
    const cart_area = document.querySelector('.main-cart_area');
    if(!cart_area) return;
    arg ? cart_area.classList.add('--show-loader') : cart_area.classList.remove('--show-loader');
  }
  
  handleErrors(response){
    const errorContainer = this.querySelector('.cart-item-row--error');
    
    if(!errorContainer) return;
    errorContainer.innerText = '';
    errorContainer.classList.add('hidden');
    
    if(response.errors){
      errorContainer.classList.remove('hidden');
      errorContainer.innerText = response.errors;
      
      this.input.value = this.initValue;
      this.errors = true;
    }
  }
  
  productCardsQtyUpdates(variantId){
    this.productCard.forEach(elem => {
      if(!elem.data) return;
      
      elem.setFromCartUpdates(variantId);
    });
  }

  getSectionsToRender() {
    return [
      {
        id: 'cart-inventory-organizer',
        section: 'cart-inventory-organizer',
        selector: 'cart-inventory-organizer'
      },
      {
        id: 'cart-items',
        selector: '#cart-items',
        section: 'cart-items'
      }
    ];
  }

  getCartToRender() {
    return [
      {
        id: 'cart-inventory-organizer',
        section: 'cart-inventory-organizer',
        selector: 'cart-inventory-organizer'
      },
      {
        id: 'cart-items',
        selector: '#cart-items',
        section: 'cart-items'
      },
      {
        id: 'main-cart',
        selector: '#main-cart',
        section: 'main-cart'
      }
    ];
  }

  getSectionInnerHTML(html, selector = '.shopify-section') {
    return new DOMParser() .parseFromString(html, 'text/html') .querySelector(selector).innerHTML;
  }
  
  setSectionRenderChanges(newHtml, name, selector){
    const newSource = newHtml.querySelector(name);
    selector.innerHTML = newSource.innerHTML;
  }
}
customElements.define('cart-item-row', CartItemRow);