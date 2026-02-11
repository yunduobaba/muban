Shopify.formatMoney = function(cents, format) {
  if (typeof cents == 'string') { cents = cents.replace('.',''); }
  var value = '';
  var placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
  var formatString = (format || this.money_format);

  function defaultOption(opt, def) {
      return (typeof opt == 'undefined' ? def : opt);
  }

  function formatWithDelimiters(number, precision, thousands, decimal) {
    precision = defaultOption(precision, 2);
    thousands = defaultOption(thousands, ',');
    decimal   = defaultOption(decimal, '.');

    if (isNaN(number) || number == null) { return 0; }

    number = (number/100.0).toFixed(precision);

    var parts   = number.split('.'),
      dollars = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + thousands),
      cents   = parts[1] ? (decimal + parts[1]) : '';

    return dollars + cents;
  }

  switch(formatString.match(placeholderRegex)[1]) {
    case 'amount':
      value = formatWithDelimiters(cents, 2);
      break;
    case 'amount_no_decimals':
      value = formatWithDelimiters(cents, 0);
      break;
    case 'amount_with_comma_separator':
      value = formatWithDelimiters(cents, 2, '.', ',');
      break;
    case 'amount_no_decimals_with_comma_separator':
      value = formatWithDelimiters(cents, 0, '.', ',');
      break;
  }

  return formatString.replace(placeholderRegex, value);
}
function pauseElementBasedMedia(element) {
  element.querySelectorAll('.js-youtube').forEach((video) => {
    video.contentWindow.postMessage('{"event":"command","func":"' + 'pauseVideo' + '","args":""}', '*');
  });
  element.querySelectorAll('.js-vimeo').forEach((video) => {
    video.contentWindow.postMessage('{"method":"pause"}', '*');
  });
  element.querySelectorAll('video').forEach((video) => video.pause());
  element.querySelectorAll('product-model').forEach((model) => {
    if (model.modelViewerUI) model.modelViewerUI.pause();
  });
}
if (!customElements.get('smooth-anchor')) {
  customElements.define('smooth-anchor', class SmoothAnchor extends HTMLElement {
    constructor() {
      super();
      
      this.anchor = this.querySelector('a') ? this.querySelector('a') : this.querySelector('button');
      this.anchor.addEventListener('click', this.onClickRef.bind(this));
    }
    
    onClickRef(){
      event.preventDefault();
      
      const targetId = this.anchor.getAttribute('href');
      const targetElement = document.querySelector(targetId);
      
      if(targetElement){
        if(this.dataset.offset){
          let offset = 0;
          const offsetElement = document.querySelector(this.dataset.offset);
          if(!offsetElement){
            doScroll();
            if(targetElement.nodeName.toLowerCase() === 'input') targetElement.focus();
            return
          };
          const elementPosition = targetElement.getBoundingClientRect().top;
          offset = elementPosition + window.scrollY - offsetElement.offsetHeight;
          window.scrollTo({
            top: offset,
            behavior: "smooth"
          });
          if(targetElement.nodeName.toLowerCase() === 'input') targetElement.focus();
          return;
        }
        doScroll();
        if(targetElement.nodeName.toLowerCase() === 'input') targetElement.focus();
      }
        
      function doScroll(){
        targetElement.scrollIntoView({
          behavior: "smooth"
        });
      }
    }
  });
}
class DeferredMedia extends HTMLElement {
  constructor() {
    super();
    const poster = this.querySelector('[id^="Deferred-Poster-"]');
    if (!poster) return;
    poster.addEventListener('click', this.loadContent.bind(this));
  }

  loadContent(focus = true) {
    if (!this.getAttribute('loaded')) {
      const content = document.createElement('div');
      content.appendChild(this.querySelector('template').content.firstElementChild.cloneNode(true));

      this.setAttribute('loaded', true);
      const deferredElement = this.appendChild(content.querySelector('video, model-viewer, iframe'));
      if (focus) deferredElement.focus();
      if (deferredElement.nodeName == 'VIDEO' && deferredElement.getAttribute('autoplay')) {
        // force autoplay for safari
        deferredElement.play();
      }
    }
  }
}
customElements.define('deferred-media', DeferredMedia);
if (!customElements.get('quantity-input')) {
  customElements.define('quantity-input', class QuantityInput extends HTMLElement {
    constructor() {
      super();
      this.input = this.querySelector('input');
      this.changeEvent = new Event('change', { bubbles: true });
      this.qtySubtotal = this.querySelector('.quantity_subtotal');

      this.input.addEventListener('change', this.onInputChange.bind(this));
      this.querySelectorAll('button').forEach(
        (button) => button.addEventListener('click', this.onButtonClick.bind(this))
      );
    }

    quantityUpdateUnsubscriber = undefined;

    connectedCallback() {
      if(this.qtySubtotal) this.initQtyPrice = this.qtySubtotal.innerText;
      
      // this.validateQtyRules();
      this.quantityUpdateUnsubscriber = subscribe(PUB_SUB_EVENTS.quantityUpdate, this.validateQtyRules.bind(this));
    }

    disconnectedCallback() {
      if (this.quantityUpdateUnsubscriber) {
        this.quantityUpdateUnsubscriber();
      }
    }

    onInputChange() {
      this.validateQtyRules();
    }

    onButtonClick(event) {
      event.preventDefault();
      const previousValue = this.input.value;
      
      if(event.target.name === 'plus' || event.target.parentElement.name === 'plus'){
        this.input.stepUp();
      
      } else{
        this.input.stepDown();
      }

      // event.target.name === 'plus' ? this.input.stepUp() : this.input.stepDown();
      if (previousValue !== this.input.value) this.input.dispatchEvent(this.changeEvent);
    }

    validateQtyRules(variant = null) {
      const value = parseInt(this.input.value);
      
      if(variant){
        this.setVariantUpdates(value, variant);
        
        return;
      }
      
      if (this.input.min) {
        const min = parseInt(this.input.min);
        const buttonMinus = this.querySelector(".quantity_button[name='minus']");
        buttonMinus.classList.toggle('disabled', value <= min);
        buttonMinus.toggleAttribute('disabled', value <= min);
      }
      if (this.input.max) {
        const max = parseInt(this.input.max);
        const buttonPlus = this.querySelector(".quantity_button[name='plus']");
        buttonPlus.classList.toggle('disabled', value >= max);
        buttonPlus.toggleAttribute('disabled', value >= max);
      }
      
      if(this.qtySubtotal){
        const parentCard = this.closest('product-card');
        const currPrice = parentCard.getCurrentPriceData();
        let multiplePrice = currPrice * value;
        
        if(value > 1){
          this.qtySubtotal.innerText = Shopify.formatMoney(multiplePrice, window.money_format);
          
          return;
        }
        
        multiplePrice = currPrice * 1;
        this.qtySubtotal.innerText = Shopify.formatMoney(multiplePrice, window.money_format);
      }
    }
    
    setVariantUpdates(val, rule){
      const minVal = rule.min;
      const maxVal = rule.max;
      const incrVal = rule.increment;
      
      if (this.input.min) {
        this.input.setAttribute('min', minVal);
        const min = parseInt(minVal);
        const buttonMinus = this.querySelector(".quantity_button[name='minus']");
        buttonMinus.classList.toggle('disabled', val <= min);
        buttonMinus.toggleAttribute('disabled', val <= min);
      }
      if (this.input.max) {
        this.input.setAttribute('max', maxVal);
        const max = parseInt(maxVal);
        const buttonPlus = this.querySelector(".quantity_button[name='plus']");
        buttonPlus.classList.toggle('disabled', val >= max);
        buttonPlus.toggleAttribute('disabled', val >= max);
      }
      
      if(this.qtySubtotal){
        const parentCard = this.closest('product-card');
        const currPrice = parentCard.getCurrentPriceData();
        const multiplePrice = currPrice * val;
        this.qtySubtotal.innerText = Shopify.formatMoney(multiplePrice, window.money_format);
      }
    }
    
    setResetSubtotals(price){
      if(!this.qtySubtotal) return;
      this.qtySubtotal.innerText = Shopify.formatMoney(price, window.money_format);
    }
    
    resetDefaults(price = null){
      this.input.value = parseInt(this.input.min);
      if(price) this.setResetSubtotals(price);
    }
    
    toggleSubtotal(status){
      if(!this.qtySubtotal) return;
      
      if(!status){
        this.qtySubtotal.classList.add('hidden');
      
      } else{
        this.qtySubtotal.classList.remove('hidden');
      }
    }
  });
}
function getFocusableElements(container) {
  return Array.from(
    container.querySelectorAll(
      "summary, a[href], button:enabled, [tabindex]:not([tabindex^='-']), [draggable], area, input:not([type=hidden]):enabled, select:enabled, textarea:enabled, object, iframe"
    )
  );
}
const trapFocusHandlers = {};
function trapFocus(container, elementToFocus = container) {
  var elements = getFocusableElements(container);
  var first = elements[0];
  var last = elements[elements.length - 1];

  removeTrapFocus();

  trapFocusHandlers.focusin = (event) => {
    if (
      event.target !== container &&
      event.target !== last &&
      event.target !== first
    )
      return;

    document.addEventListener('keydown', trapFocusHandlers.keydown);
  };

  trapFocusHandlers.focusout = function() {
    document.removeEventListener('keydown', trapFocusHandlers.keydown);
  };

  trapFocusHandlers.keydown = function(event) {
    if (event.code.toUpperCase() !== 'TAB') return; // If not TAB key
    // On the last focusable element and tab forward, focus the first element.
    if (event.target === last && !event.shiftKey) {
      event.preventDefault();
      first.focus();
    }

    //  On the first focusable element and tab backward, focus the last element.
    if (
      (event.target === container || event.target === first) &&
      event.shiftKey
    ) {
      event.preventDefault();
      last.focus();
    }
  };

  document.addEventListener('focusout', trapFocusHandlers.focusout);
  document.addEventListener('focusin', trapFocusHandlers.focusin);

  elementToFocus.focus();

  if (elementToFocus.tagName === 'INPUT' &&
    ['search', 'text', 'email', 'url'].includes(elementToFocus.type) &&
    elementToFocus.value) {
    elementToFocus.setSelectionRange(0, elementToFocus.value.length);
  }
}
// Here run the querySelector to figure out if the browser supports :focus-visible or not and run code based on it.
try {
  document.querySelector(":focus-visible");
} catch(e) {
  focusVisiblePolyfill();
}
function focusVisiblePolyfill() {
  const navKeys = ['ARROWUP', 'ARROWDOWN', 'ARROWLEFT', 'ARROWRIGHT', 'TAB', 'ENTER', 'SPACE', 'ESCAPE', 'HOME', 'END', 'PAGEUP', 'PAGEDOWN']
  let currentFocusedElement = null;
  let mouseClick = null;

  window.addEventListener('keydown', (event) => {
    if(navKeys.includes(event.code.toUpperCase())) {
      mouseClick = false;
    }
  });

  window.addEventListener('mousedown', (event) => {
    mouseClick = true;
  });

  window.addEventListener('focus', () => {
    if (currentFocusedElement) currentFocusedElement.classList.remove('focused');

    if (mouseClick) return;

    currentFocusedElement = document.activeElement;
    currentFocusedElement.classList.add('focused');

  }, true);
}
function removeTrapFocus(elementToFocus = null) {
  document.removeEventListener('focusin', trapFocusHandlers.focusin);
  document.removeEventListener('focusout', trapFocusHandlers.focusout);
  document.removeEventListener('keydown', trapFocusHandlers.keydown);

  if (elementToFocus) elementToFocus.focus();
}
function onKeyUpEscape(event) {
  if (event.code.toUpperCase() !== 'ESCAPE') return;

  const openDetailsElement = event.target.closest('details[open]');
  if (!openDetailsElement) return;

  const summaryElement = openDetailsElement.querySelector('summary');
  openDetailsElement.removeAttribute('open');
  summaryElement.setAttribute('aria-expanded', false);
  summaryElement.focus();
}
function debounce(fn, wait) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}
function fetchConfig(type = 'json') {
  return {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': `application/${type}` }
  };
}
if (!customElements.get('hideable-element')) {
  customElements.define('hideable-element', class HideableElement extends HTMLElement {
    constructor() {
      super();
      this.elementToHide = this.querySelector('aside');
      this.elementToggle = this.querySelector('.js-contents--btn-close');
      const hasBeenHidden = localStorage.getItem(`${this.elementToHide.id}-hidden`);
      
      if (hasBeenHidden) {
        this.elementToHide.classList.add('hidebar');
      }
      
      if(this.elementToggle){
        this.elementToggle.addEventListener('click', () => {
          this.elementToHide.style.display = 'none';
          localStorage.setItem(`${this.elementToHide.id}-hidden`, true);
        });
      }
    }
  });
}
// Countdown_Timer
if (!customElements.get('countdown-timer')) {
  customElements.define('countdown-timer', class CountdownTimer extends HTMLElement {
    constructor() {
      super();
      const endDate = new Date(this.getAttribute('end-date'));
      if (isNaN(endDate)) {
        //this.innerHTML = '<div class="block"> <span class="time">0</span> <span class="text">day</span> </div> <div class="block"> <span class="time">0</span> <span class="text">hour</span> </div> <div class="block"> <span class="time">0</span> <span class="text">min</span> </div> <div class="block"> <span class="time">0</span> <span class="text">sec</span> </div>';
        this.classList.add('hidden');
        const message = this.nextElementSibling;
        if(!message || !message.classList.contains('countdown-timer_message')) return;
        message.classList.remove('hidden');
        return;
      } else {
        const remainingTime = endDate.getTime() - Date.now();
        if (remainingTime <= 0) {
          this.innerHTML = `<div class="block"> <span class="time">0</span> <span class="text">${window.additionalStrings.countdown_days_label}</span> </div> <div class="block"> <span class="time">0</span> <span class="text">${window.additionalStrings.countdown_hours_label}</span> </div> <div class="block"> <span class="time">0</span> <span class="text">${window.additionalStrings.countdown_min_label}</span> </div> <div class="block"> <span class="time">0</span> <span class="text">${window.additionalStrings.countdown_sec_label}</span> </div>`;
        } else {
          this.remainingTime = remainingTime;
          this.innerHTML = this.getTimeString();
        }
      }
    }

    connectedCallback() {
      if (isNaN(this.remainingTime)) {
        this.classList.add('hidden');
        const message = this.nextElementSibling;
        if(!message || !message.classList.contains('countdown-timer_message')) return;
        message.classList.remove('hidden');
        return;
      }
      this.intervalId = setInterval(() => {
        this.remainingTime -= 1000;
        this.innerHTML = this.getTimeString();
        if (this.remainingTime <= 0) {
          clearInterval(this.intervalId);
          this.dispatchEvent(new Event('timeup'));
        }
      }, 1000);
    }

    getTimeString() {
      if (isNaN(this.remainingTime) || this.remainingTime <= 0) {
        //return '<div class="block"> <span class="time">0</span> <span class="text">days</span> </div> <div class="block"> <span class="time">0</span> <span class="text">hours</span> </div> <div class="block"> <span class="time">0</span> <span class="text">mins</span> </div> <div class="block"> <span class="time">0</span> <span class="text">secs</span> </div>';
        this.classList.add('hidden');
        const message = this.nextElementSibling;
        if(!message || !message.classList.contains('countdown-timer_message')) return;
        message.classList.remove('hidden');
        return;
      }
      const days = Math.floor(this.remainingTime / (1000 * 60 * 60 * 24));
      const hours = Math.floor((this.remainingTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((this.remainingTime % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((this.remainingTime % (1000 * 60)) / 1000);
      return `<div class="block"> <span class="time">${days}</span> <span class="text">${window.additionalStrings.countdown_days_label}</span> </div> <div class="block"> <span class="time">${hours}</span> <span class="text">${window.additionalStrings.countdown_hours_label}</span> </div> <div class="block"> <span class="time">${minutes}</span> <span class="text">${window.additionalStrings.countdown_min_label}</span> </div> <div class="block"> <span class="time">${seconds}</span> <span class="text">${window.additionalStrings.countdown_sec_label}</span> </div>`;
    }
  });
}

if (!customElements.get('accordion-wrapper')) {
  customElements.define('accordion-wrapper', class AccordionWrapper extends HTMLElement {
    constructor() {
      super();
      
      this.toggle = this.querySelector('summary');
      if(this.toggle) this.toggle.addEventListener('click', this.accordion.bind(this));
    }
    
    accordion(event){
      if(this.dataset.behavior === 'open-close') this.setEventListners();
      if(this.toggle.parentElement.hasAttribute('open') && this.dataset.behavior !== 'open-close') this.keepOpen(event);
      if(!this.toggle.parentElement.hasAttribute('open')) this.closeOther();
    }
    
    closeOther(){
      const allRows = document.querySelectorAll(`#${this.dataset.parent} details`);
      allRows.forEach(toggler => {
        if(toggler.querySelector('summary') === this.toggle && this.dataset.behavior !== 'open-close') return;
        toggler.removeAttribute('open');
      });
    }
    
    keepOpen(event){
      const toggle = event.target.closest('details');
      toggle.removeAttribute('open');
    }
    
    setEventListners(){
      document.body.addEventListener('click', this.hideOutside.bind(this));
      this.addEventListener('keyup', this.onKeyUp.bind(this));
    }
    
    hideOutside(event){
      const target = event.target;
      const boundings = this.querySelector('.collapsible-row_content');
      if (boundings.contains(target) || target === boundings || target.closest('.collapsible-row_content')) return;
      this.closeOther();
    }

    onKeyUp(event){
      if (event.code.toUpperCase() !== 'ESCAPE') return;
      this.closeOther();
    }
  });
}

/*
 * Shopify Common JS
 *
 */
if ((typeof window.Shopify) == 'undefined') {
  window.Shopify = {};
}
Shopify.bind = function(fn, scope) {
  return function() {
    return fn.apply(scope, arguments);
  }
};
Shopify.setSelectorByValue = function(selector, value) {
  for (var i = 0, count = selector.options.length; i < count; i++) {
    var option = selector.options[i];
    if (value == option.value || value == option.innerHTML) {
      selector.selectedIndex = i;
      return i;
    }
  }
};
Shopify.addListener = function(target, eventName, callback) {
  target.addEventListener ? target.addEventListener(eventName, callback, false) : target.attachEvent('on'+eventName, callback);
};
Shopify.postLink = function(path, options) {
  options = options || {};
  var method = options['method'] || 'post';
  var params = options['parameters'] || {};

  var form = document.createElement("form");
  form.setAttribute("method", method);
  form.setAttribute("action", path);

  for(var key in params) {
    var hiddenField = document.createElement("input");
    hiddenField.setAttribute("type", "hidden");
    hiddenField.setAttribute("name", key);
    hiddenField.setAttribute("value", params[key]);
    form.appendChild(hiddenField);
  }
  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
};
Shopify.CountryProvinceSelector = function(country_domid, province_domid, options) {
  this.countryEl         = document.getElementById(country_domid);
  this.provinceEl        = document.getElementById(province_domid);
  this.provinceContainer = document.getElementById(options['hideElement'] || province_domid);

  Shopify.addListener(this.countryEl, 'change', Shopify.bind(this.countryHandler,this));

  this.initCountry();
  this.initProvince();
};
Shopify.CountryProvinceSelector.prototype = {
  initCountry: function() {
    var value = this.countryEl.getAttribute('data-default');
    Shopify.setSelectorByValue(this.countryEl, value);
    this.countryHandler();
  },

  initProvince: function() {
    var value = this.provinceEl.getAttribute('data-default');
    if (value && this.provinceEl.options.length > 0) {
      Shopify.setSelectorByValue(this.provinceEl, value);
    }
  },

  countryHandler: function(e) {
    var opt       = this.countryEl.options[this.countryEl.selectedIndex];
    var raw       = opt.getAttribute('data-provinces');
    var provinces = JSON.parse(raw);

    this.clearOptions(this.provinceEl);
    if (provinces && provinces.length == 0) {
      this.provinceContainer.style.display = 'none';
    } else {
      for (var i = 0; i < provinces.length; i++) {
        var opt = document.createElement('option');
        opt.value = provinces[i][0];
        opt.innerHTML = provinces[i][1];
        this.provinceEl.appendChild(opt);
      }

      this.provinceContainer.style.display = "";
    }
  },

  clearOptions: function(selector) {
    while (selector.firstChild) {
      selector.removeChild(selector.firstChild);
    }
  },

  setOptions: function(selector, values) {
    for (var i = 0, count = values.length; i < values.length; i++) {
      var opt = document.createElement('option');
      opt.value = values[i];
      opt.innerHTML = values[i];
      selector.appendChild(opt);
    }
  }
};
Shopify.CountryProvinceSelector = function(country_domid, province_domid, options) {
  this.countryEl         = document.getElementById(country_domid);
  this.provinceEl        = document.getElementById(province_domid);
  this.provinceContainer = document.getElementById(options['hideElement'] || province_domid);

  Shopify.addListener(this.countryEl, 'change', Shopify.bind(this.countryHandler,this));

  this.initCountry();
  this.initProvince();
};
Shopify.CountryProvinceSelector.prototype = {
  initCountry: function() {
    var value = this.countryEl.getAttribute('data-default');
    Shopify.setSelectorByValue(this.countryEl, value);
    this.countryHandler();
  },

  initProvince: function() {
    var value = this.provinceEl.getAttribute('data-default');
    if (value && this.provinceEl.options.length > 0) {
      Shopify.setSelectorByValue(this.provinceEl, value);
    }
  },

  countryHandler: function(e) {
    var opt       = this.countryEl.options[this.countryEl.selectedIndex];
    var raw       = opt.getAttribute('data-provinces');
    var provinces = JSON.parse(raw);

    this.clearOptions(this.provinceEl);
    if (provinces && provinces.length == 0) {
      this.provinceContainer.style.display = 'none';
    } else {
      for (var i = 0; i < provinces.length; i++) {
        var opt = document.createElement('option');
        opt.value = provinces[i][0];
        opt.innerHTML = provinces[i][1];
        this.provinceEl.appendChild(opt);
      }

      this.provinceContainer.style.display = "";
    }
  },

  clearOptions: function(selector) {
    while (selector.firstChild) {
      selector.removeChild(selector.firstChild);
    }
  },

  setOptions: function(selector, values) {
    for (var i = 0, count = values.length; i < values.length; i++) {
      var opt = document.createElement('option');
      opt.value = values[i];
      opt.innerHTML = values[i];
      selector.appendChild(opt);
    }
  }
};
function validation() {
  let email = document.querySelectorAll('[name="contact[email]"]');
  let pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  email.forEach(input => {
    let text = input.closest('form').querySelector('.results-wrap_message');
    let button = input.closest('form').querySelector('[type="submit"]');
    if (input.value.match(pattern)) {
      if(text) text.innerHTML = window.accessibilityStrings.newsletterValidMessage;
      if(text) text.style.color = 'var(--section-success-color)';
      input.classList.remove('form-control--error');
      if(button) button.removeAttribute('disabled');
    } else {
      if(text) text.innerHTML = window.accessibilityStrings.newsletterInValidMessage;
      if(text) text.style.color = 'var(--section-error-color)';
      input.classList.add('form-control--error');
      if(button) button.setAttribute('disabled', '');
      if (event.keyCode == '13') {
        event.preventDefault();
      }
    }
  
    if (input.value == '') {
      if(text) text.innerHTML = "";
      if(text) text.style.color = 'var(--section-success-color)';
      input.classList.remove('form-control--error');
      if(button) button.setAttribute('disabled', '');
    }
  });
};
document.addEventListener('DOMContentLoaded', function(){
  const compareListStorage = localStorage.getItem('comparelist');
  const comparelistContainer = document.querySelector('[data-modal-main="compare"]');
  if(!comparelistContainer) return;
  const comparelistOrganizer = document.querySelector('.compare-counter');
  const compareLimit = 3;
  let compareList = compareListStorage ? JSON.parse(compareListStorage) : [];
    
  if(compareList.length && compareList.length >= compareLimit){
    comparelistContainer.classList.add('--limit-exceed');
  
  } else{
    comparelistContainer.classList.remove('--limit-exceed');
  }
  
  if(comparelistOrganizer){
    comparelistOrganizer.innerText = compareList.length;
    const modalOpener = document.querySelector('[data-modal-main="compare"]');

    if(compareList.length === 0){
      modalOpener.classList.add('hidden');
    
    } else if(compareList.length === 1){
      modalOpener.classList.remove('hidden');
      modalOpener.classList.add('--disabled');
    
    } else{
      modalOpener.classList.remove('--disabled');
      modalOpener.classList.remove('hidden');
    }
  }
  
  const currentUrl = window.location.href;
  const url = new URL(currentUrl);
  const formType = url.searchParams.get('form_type');
  const msg = url.searchParams.get('contact[Message]');
  const contactPosted = url.searchParams.get('contact_posted');

  if (formType === 'contact' || contactPosted === 'true') {
    var hashIndex = currentUrl.indexOf('#');
    const popup = hashIndex !== -1 ? document.getElementById(currentUrl.slice(hashIndex + 1)).closest('modal-component') : document.querySelector('[data-modal="modal-question-ask"]');
    if(popup) popup.open();
  }
});
if (!customElements.get('sticky-block')) {
  customElements.define('sticky-block', class StickyBlock extends HTMLElement {
    constructor() {
      super();
      
      if(!this.dataset.refBlock && !this.dataset.behavior) return;
      this.onLoad = setTimeout(this.initialize.bind(this), 2000);
    }
    
    connectedCallback(){
      document.addEventListener('DOMContentLoaded', function(){this.onload;});
    }
    
    initialize(){
      this.behavior = this.dataset.behavior;
      this.spacer = this.dataset.spacer;
      this.endBounds = document.body.offsetHeight + this.offsetHeight;
      
      if(this.behavior){
        switch (this.behavior) {
          case 'downwards':
            window.addEventListener('scroll', this.onDownwardScroll.bind(this));
            break;
          case 'upwards':
            window.addEventListener('scroll', this.onUpwardScroll.bind(this));
            break;
          case 'stacked':
            window.addEventListener('scroll', this.onStackedScroll.bind(this));
            break;
          default:
            console.log('init sticky block');
            break;
        }
      }
      this.refBlock = document.querySelector(this.dataset.refBlock);
      if(!this.refBlock) return;
      
      this.refBoundings = this.refBlock.getBoundingClientRect();
      this.offset = this.dataset.offset ? parseFloat(this.dataset.offset) : 0;
      this.threshold = this.refBlock.offsetTop + this.refBoundings.height + this.offset;
      this.previousScrollAmount = window.screenY;
      this.percent = this.dataset.pagePercentage ? this.dataset.pagePercentage : null;
      
      if(this.spacer) this.height = this.refBlock.offsetHeight;
    }
    
    onDownwardScroll(){
      let revealedAttr = false;
      
      if(this.percent){
        const pageHeight = document.documentElement.offsetHeight;
        const threshold = pageHeight * parseFloat(this.percent) / 100;
        this.threshold = threshold;
      }
      
      if(window.scrollY > this.threshold){
        revealedAttr = true;
      }
      
      this.setStickyStatus(revealedAttr);
    }
    
    onUpwardScroll(){
      let revealedAttr = false;
      const threshold = this.height ? this.height : this.refBlock.offsetHeight;
      
      if (window.scrollY > this.previousScrollAmount) {
        revealedAttr = false;
        
      } else if (window.scrollY < this.previousScrollAmount) {
        revealedAttr = true;
        this.dropdownClose();
        
        if(window.scrollY < threshold){
          revealedAttr = false;
        }
      }
      
      this.setStickyStatus(revealedAttr);
      this.previousScrollAmount = window.scrollY;
    }
    
    onStackedScroll(){
      let revealedAttr = false;
      if(this.refBoundings.y < 0) this.refBoundings.y += window.scrollY;
      if(this.refBoundings.y < window.scrollY){
        revealedAttr = true;
      }
      
      this.setStickyStatus(revealedAttr);
    }
    
    setStickyStatus(revealed){
      if(this.dataset.hideOnEnd === 'true'){
        if((window.innerHeight + window.scrollY) >= this.endBounds){
          this.stickyHide();
          return;
        }
      }
      
      if(revealed){
        this.setAttribute('data-revealed', true);
        if(this.dataset.hasHidden === 'true') this.removeAttribute('aria-hidden');
        if(this.dataset.bodyClass) document.body.classList.add(this.dataset.bodyClass);
        if(this.height){
          this.style.height = this.height + 'px';
          if(this.dataset.bodyClass) document.body.style.setProperty('--page-header-height', this.height + 'px');
        }
        return;
      }
      
      this.stickyHide();
    }
    
    stickyHide(){
      this.setAttribute('data-revealed', false);
      if(this.dataset.hasHidden === 'true') this.setAttribute('aria-hidden', true);
      if(this.dataset.bodyClass) document.body.classList.remove(this.dataset.bodyClass);
      if(this.height){
        this.style.removeProperty('height');
        
        if(this.dataset.bodyClass) document.body.style.removeProperty('--page-header-height');
      }
    }
    
    dropdownClose(){
      const dropdowns = this.querySelectorAll('dropdown-component');
      if(!dropdowns) return;
      dropdowns.forEach(dropdown => {
        dropdown.close();
      });
    }
  });
}

if (!customElements.get('product-card-compare-remove')) {
  customElements.define('product-card-compare-remove', class ProductCardCompareRemove extends HTMLElement {
    constructor() {
      super();
      
      this.btn = this.querySelector('a') ? this.querySelector('a') : this.querySelector('button');
      if(this.btn) this.btn.addEventListener('click', this.onCompareRemoval.bind(this));
    }
    
    onCompareRemoval(){
      event.preventDefault();
      
      const compareBtns = document.querySelectorAll('product-compare-button');
      const compareListStorage = localStorage.getItem('comparelist');
      const comparelistContainer = document.querySelector('[data-modal-main="compare"]');
      const comparelistOrganizer = document.querySelector('.compare-counter');
      const modalCompare = document.querySelector('[data-modal][data-compare="true"]');
      let compareList = compareListStorage ? JSON.parse(compareListStorage) : [];
      var index = compareList.indexOf(this.dataset.handle);
      
      if (index !== -1) {
        compareList.splice(index, 1);
      }
      localStorage.setItem('comparelist', JSON.stringify(compareList));
      if(modalCompare) modalCompare.close();
      
      // const parentColumn = this.btn.closest('.compare-product');
      // if(parentColumn) parentColumn.parentElement.remove();
      
      if(comparelistContainer.classList.contains('--limit-exceed')) comparelistContainer.classList.remove('--limit-exceed');
      const modalOpener = document.querySelector('[data-modal-main="compare"]');
      if(compareList.length === 0){
        modalOpener.classList.add('hidden');
        const modal = document.querySelector('[data-modal="modal-compare-show"]');
        if(modal) modal.close();
      
      } else if(compareList.length === 1){
        modalOpener.classList.remove('hidden');
        modalOpener.classList.add('--disabled');
      
      } else{
        modalOpener.classList.remove('--disabled');
        modalOpener.classList.remove('hidden');
      }
      if(comparelistOrganizer){
        comparelistOrganizer.innerText = compareList.length;
      }
      if(compareBtns){
        compareBtns.forEach(btn => {
          if(btn.dataset.handle == this.dataset.handle && btn.anchor.classList.contains('--compare-active')) btn.anchor.classList.remove('--compare-active');
        });
      }
      if(compareList.length !== 0 && modalCompare) modalCompare.open();
    }
  });
}
if (!customElements.get('product-recommendations')) {
  customElements.define('product-recommendations', class ProductRecommendations extends HTMLElement {
    constructor() {
      super();
      
      this.bundleContainer = document.querySelector('bundle-product-wrapper');
    }

    connectedCallback() {
      this.empty = true;
      
      const handleIntersection = (entries, observer) => {
        if (!entries[0].isIntersecting) return;
        observer.unobserve(this);

        fetch(this.dataset.url)
          .then(response => response.text())
          .then(text => {
            const html = document.createElement('div');
            html.innerHTML = text;
            const recommendations = html.querySelector('.product-recommendations');

            if (recommendations && recommendations.innerHTML.trim().length) {
              this.empty = false;
              this.innerHTML = recommendations.innerHTML;
              
              if(!recommendations.innerHTML.includes('<product-card')){
                let recommendationAncestor = this.parentElement;
                
                while (recommendationAncestor && !recommendationAncestor.classList.contains('recommendation')) {
                  recommendationAncestor = recommendationAncestor.parentElement;
                }
                
                if(recommendationAncestor){
                  recommendationAncestor.classList.add('hidden');
                }
              }
            
            } else{
              if(this.bundleContainer) this.bundleContainer.classList.add('hidden');
            }
          })
          .catch(e => {
            console.error(e);
          })
          .finally(() => {
            if(this.bundleContainer) this.bundleContainer.initBundleCheck();
            if(this.empty) this.parentElement.classList.add('hidden');
          });
      }

      new IntersectionObserver(handleIntersection.bind(this), {rootMargin: '0px 0px 400px 0px'}).observe(this);
    }
  });
}

// marquee
if (!customElements.get('marquee-component')) {
  customElements.define('marquee-component', class MarqueeComponent extends HTMLElement {
    constructor() {
      super();

      if(this.dataset.pauseOnHover === 'true'){
        this.addEventListener('mouseenter', this.setOnPause.bind(this));
        this.addEventListener('mouseleave', this.setOnResume.bind(this));
      }
      
      this.onLoad = setTimeout(this.initialize.bind(this), 2000);
    }

    connectedCallback(){
      this.columnsCount = this.querySelectorAll('.marquee-component_col:not([class*="cloned"])').length;
      document.addEventListener('DOMContentLoaded', function(){this.onload;});
    }

    initialize(){
      this.init = null;
      this.initBounds = this.getColumnsSize() * 2;
      if(this.initBounds === 0) return;
      this.mainBounds = this.dataset.rotation ? this.getBoundingClientRect().height : this.getBoundingClientRect().width;
      this.createClones();
      this.dataset.direction === 'forward' ? this.setOnMarquee(this.initBounds * -1, this.initBounds) : this.setOnMarquee(0, this.initBounds);
    }

    setOnMarquee(pos, cycle){
      const speed = parseFloat(this.dataset.speed);
      let cycleCount = cycle;
      let container = this.querySelector('.marquee-component');
      clearInterval(this.init);
      this.init = setInterval(frame.bind(this), speed);

      function frame(){
        if(cycleCount <= 1){
          clearInterval(this.init);
          if(this.dataset.rotation){
            container.style.top = 0 + 'px';
          } else{
            container.style.left = 0 + 'px';
          }
          this.dataset.direction === 'forward' ? this.setOnMarquee(this.initBounds * -1, this.initBounds) : this.setOnMarquee(0, this.initBounds);
          this.pos = pos;
        
        } else{
          this.dataset.direction === 'forward' ? pos++ : pos--;
          cycleCount--;
          this.pos = pos;
          this.cycleCount = cycleCount;
          
          if(this.dataset.rotation){
            container.style.top = pos + 'px';
          } else{
            container.style.left = pos + 'px';
          }
        }
      }
    }

    setOnPause(){
      clearInterval(this.init);
    }

    setOnResume(){
      this.setOnMarquee(this.pos, this.cycleCount);
    }

    setContainer(size, container){
      if(this.dataset.rotation){
        container.style.height = size + 'px';
        container.style.top = (this.initBounds * -1) + 'px';
      } else{
        container.style.width = size + 'px';
        container.style.left = (this.initBounds * -1) + 'px';
      }
    }

    setTabIndexing(){
      const focusables = this.querySelectorAll('[class*="cloned"] a', '[class*="cloned"] button');
      focusables.forEach(element => {
        element.tabIndex = -1;
        element.setAttribute('aria-hidden', 'true');
      });
    }

    createClones(){
      const wrapper = this.querySelector('.marquee-component');
      this.sizes = this.getColumnsSize();
      if(this.sizes === 0) return;
      this.clone(wrapper);

      while(this.sizes < this.mainBounds){
        this.clone(wrapper);
        this.createClones();
      }
      this.setContainer(this.sizes, wrapper);
      this.setTabIndexing();
    }

    clone(wrapper){
      const columns = this.querySelectorAll('.marquee-component_col:not([class*="cloned"])');
      for(const column of columns){
        const clonedColumn = column.cloneNode(true);
        clonedColumn.classList.add('clonedBefore');
        wrapper.insertBefore(clonedColumn, columns[0]);
      }
      for(const column of columns){
        const clonedColumn = column.cloneNode(true);
        clonedColumn.classList.add('clonedAfter');
        wrapper.appendChild(clonedColumn);
      }
    }

    getColumnsSize(){
      let widths = 0;
      const columns = this.querySelectorAll('.marquee-component_col');
      columns.forEach(column => {
        const bounds = column.getBoundingClientRect();
        widths += this.dataset.rotation ? bounds.height : bounds.width;
      });

      return widths;
    }
  });
}

// button dropdown component
if (!customElements.get('dropdown-component')) {
  customElements.define('dropdown-component', class DropdownComponent extends HTMLElement {
    constructor() {
      super();
      
      if(this.dataset.desktopHidden === 'true' && screen.width > 767) return;
      this.button = this.querySelector('.dropdown-component_opener:not(.hidden)');
      this.content = this.querySelector('.dropdown-component_wrapper');
      this.onButtonClick = this.toggleDropdown.bind(this);
      this.shareEvent = this.copyToClipboard.bind(this);
      this.shareClose = this.close.bind(this);
      this.onBodyClick = this.onBodyClick.bind(this);
      this.onKeyUp = this.onKeyUp.bind(this);
      this.button.addEventListener('click', this.onButtonClick);

      if(this.dataset.submission === 'true'){
        this.input = this.querySelector('input');
        const itemsArr = this.content.querySelectorAll('.dropdown-component_btn-submit');
        if(!itemsArr) return;
        itemsArr.forEach(item => {item.addEventListener('click', this.onItemClick.bind(this));});
      }
      
      if(this.dataset.sorting === 'true'){
        const itemsArr = this.content.querySelectorAll('.dropdown-component_btn-sort');
        if(!itemsArr) return;
        itemsArr.forEach(item => {item.addEventListener('click', this.onSort.bind(this));});
      }
      
      if(this.dataset.share === 'true'){
        this.elements = {
          successMessage: this.querySelector('.shareMessage'),
          closeButton: this.querySelector('.share-button__close'),
          shareButton: this.querySelector('.share-button__copy'),
          urlInput: this.querySelector('.shareUrl')
        }
        if(navigator.share){
          this.button.removeEventListener('click', this.onButtonClick);
          this.button.addEventListener('click', () => { navigator.share({ url: this.elements.urlInput.value, title: document.title }); });
          return;
        }
      }
      
      this.setIndexing(false);
    }

    toggleDetails(){
      if(!this.dataset.share) return;
      this.elements.successMessage.classList.add('hidden');
      this.elements.successMessage.textContent = '';
      this.elements.closeButton.classList.add('hidden');
    }

    copyToClipboard(){
      if(!this.dataset.share) return;
      navigator.clipboard.writeText(this.elements.urlInput.value).then(() => {
        this.elements.successMessage.classList.remove('hidden');
        this.elements.successMessage.textContent = window.accessibilityStrings.shareSuccess;
        this.elements.closeButton.classList.remove('hidden');
      });
      this.elements.closeButton.addEventListener('click', this.shareClose);
    }

    open(){
      this.button.setAttribute('aria-expanded', true);
      this.content.focus();
      this.content.classList.add('dropdown--open');
      const focusables = this.dataset.dropdownLevel === '2' ? this.querySelectorAll('a[data-level="2"],button[data-level="2"]') : this.querySelectorAll('a[data-level="1"],button[data-level="1"]');
      document.body.addEventListener('click', this.onBodyClick);
      this.addEventListener('keyup', this.onKeyUp);
      if(this.dataset.share === 'true'){
        if(!navigator.share){
          this.elements.shareButton.addEventListener('click', this.shareEvent);
        }
      }
      if(!focusables) return;
      this.setIndexing(true, focusables);
    }

    close(){
      this.button.setAttribute('aria-expanded', false);
      this.content.classList.remove('dropdown--open');
      document.body.removeEventListener('click', this.onBodyClick);
      this.removeEventListener('keyup', this.onKeyUp);
      if(this.dataset.share === 'true'){
        if(navigator.share){
          this.elements.shareButton.removeEventListener('click', () => { navigator.share(); });
        
        } else{
          this.elements.shareButton.removeEventListener('click', this.shareEvent);
        }
        this.toggleDetails();
      }
      const focusables = this.dataset.dropdownLevel === '2' ? this.querySelectorAll('a[data-level="2"],button[data-level="2"]') : this.querySelectorAll('a[data-level="1"],button[data-level="1"]');
      if(!focusables) return;
      this.setIndexing(false, focusables);
    }

    toggleDropdown(event){
      if(event.target.getAttribute('aria-expanded') === 'true') return this.close();
      this.open();
    }

    onBodyClick(event){
      const target = event.target;
      if(this.contains(target) || target === this || target === this.button
        && this.button.getAttribute('aria-expanded') === 'true') return;
      
      if(this.dataset.dropdownLevel === '2'){
        event.stopPropagation();
        this.close();
        return;
      }

      this.close();
    }

    onKeyUp(event){
      if(event.code.toUpperCase() !== 'ESCAPE') return;
      
      if(this.dataset.dropdownLevel === '2'){
        event.stopPropagation();
        this.close();
        return;
      }
      this.close();
      this.button.focus();
    }

    onItemClick(event) {
      event.preventDefault();
      const form = document.getElementById(this.dataset.formId);
      if(this.input) this.input.value = event.currentTarget.dataset.value;
      if (this.input && form) form.submit();
    }
    
    onSort(event){
      event.preventDefault();
      const sortInput = document.getElementById(this.dataset.inputId);
      let form = document.querySelector('.filters-sidebar filters-form form');
      if(!form) form = document.querySelector('#filters-form');
      if(!sortInput || !form) return;
      const value = event.target.dataset.value;
      const text = event.target.firstChild.textContent;
      this.button.firstChild.textContent = text;
      sortInput.value = value;
      form.dispatchEvent(new Event('input'));
    }
    
    setIndexing(flag, arr = null){
      const focusables = arr ? arr : this.content.querySelectorAll('a[data-level],button[data-level]');
      if(!focusables) return;
      focusables.forEach(element => {
        indexing(flag, element);
      });
      
      function indexing(condition, element){
        if(condition){
          element.removeAttribute('tabindex');
        
        } else{
          element.setAttribute('tabindex', '-1');
        }
      }
    }
  });
}

// modal / drawer toggler
if (!customElements.get('modal-component-toggler')) {
  customElements.define('modal-component-toggler', class ModalComponentToggler extends HTMLElement {
    constructor() {
      super();
      
      if(this.dataset.desktopHidden && screen.width > 991) return;
      if(this.dataset.mobileHidden && screen.width < 768) return;
      this.button = this.querySelector('button');
      this.button.addEventListener('click', this.toggleModal.bind(this));
    }

    open(modal){
      modal.open(this.button);
      this.button.setAttribute('data-expanded', 'true');
    }

    close(modal){
      modal.close();
    }

    toggleModal(event){
      event.preventDefault();

      if(this.dataset.storage === 'true') localStorage.setItem(this.dataset.storageKey, this.dataset.storageValue);
      const modal = document.querySelector(`[data-modal="${this.button.dataset.modalRef}"]`);
      if(this.button.dataset.expanded === 'true') return this.close(modal);
      this.open(modal);
    }
  });
}

// modal / drawer content component
if (!customElements.get('modal-component')) {
  customElements.define('modal-component', class ModalComponent extends HTMLElement {
    constructor() {
      super();
      
      if(this.dataset.desktopHidden && screen.width > 991) return;
      if(this.dataset.mobileHidden && screen.width < 768) return;
      if(this.dataset.storage === 'true'){
        const keyExists = localStorage.getItem(this.dataset.storageKey);
        if(keyExists === this.dataset.storageValue) return this.remove();
      }
      this.toggler = null;
      this.parent = null;
      this.content = this.querySelector('.modal-component');
      this.onKeyUp = this.onKeyUp.bind(this);
      this.onBodyClick = this.onBodyClick.bind(this);
      
      if(this.dataset.compare === 'true'){
        this.elements = {
          counterElement: this.querySelector('.compare-counter'),
          contentBody: this.querySelector('.compare-popup_body'),
          contentGrid: this.querySelector('.compare-popup_grid'),
        }
      }

      if(this.dataset.trigger === 'self'){
        this.open();
      }
    }

    open(toggler = null){
      this.toggler = toggler;
      if(this.dataset.container === 'body'){
        this.parent = this.parentElement;
        document.body.append(this);
      }
      this.setClasses(true);
      if(this.dataset.compare === 'true'){
        this.onContentOpen();
      } else{
        this.content.focus();
        trapFocus(this.content);
      }
      if(!this.dataset.trigger || this.dataset.trigger !== 'self') this.setListeners(true);
    }

    close(){
      if(this.dataset.container === 'body'){
        if(this.parentNode === document.body) document.body.removeChild(this);
        if(this.parent) this.parent.append(this);
      }
      if(this.toggler) this.toggler.setAttribute('data-expanded', 'false');
      this.setClasses(false);
      if(this.toggler) removeTrapFocus(this.toggler);
      this.toggler = null;
      this.parent = null;
      this.setListeners(false);
      if(this.dataset.formReset === 'true'){
        const form = this.querySelector('form');
        if(form) form.reset();
      }
    }

    setClasses(flag){
      if(!flag){
        this.classList.remove('modal--active');
        document.body.classList.remove(`${this.dataset.modal}--modal-active`, 'overflow-hidden');
        return;
      }
      this.classList.add('modal--active');
      document.body.classList.add(`${this.dataset.modal}--modal-active`, 'overflow-hidden');
    }

    setListeners(flag){
      if(flag){
        this.addEventListener('keyup', this.onKeyUp);
        if(!this.dataset.compare) this.addEventListener('click', this.onBodyClick);
      
      } else{
        this.removeEventListener('keyup', this.onKeyUp);
        if(!this.dataset.compare) this.removeEventListener('click', this.onBodyClick);
      }
    }

    onBodyClick(event){
      const target = event.target;
      const boundings = this.querySelector('.modal-component_body');
      if (boundings.contains(target) || target === boundings) return;
      this.close();
    }

    onKeyUp(event){
      if (event.code.toUpperCase() !== 'ESCAPE') return;
      this.close();
    }
    
    onContentOpen(){
      this.classList.remove('--loaded');
      this.elements.contentBody.classList.add('--show-loader');
      this.elements.contentGrid.innerHTML = '';
      const compareListStorage = localStorage.getItem('comparelist');
      const compareList = JSON.parse(compareListStorage);
      while (compareList.length < 3) {
        compareList.push('product');
      }
      this.initRenderProcess(compareList);
    }
    
    initRenderProcess(arr){
      if(arr.length){
        const columnCurr = arr[0];
        this.getCompareRender(columnCurr, arr);
        
        return;
      }
      this.setSameheightRows();
      
      this.elements.contentBody.classList.remove('--show-loader');
      this.classList.add('--loaded');
      this.content.focus();
      trapFocus(this.content);
    }
    
    getCompareRender(handle, all){
      fetch(`${this.dataset.url}/products/${handle}/?section_id=${this.dataset.sectionId}`)
        .then((response) => response.text())
        .then((responseText) => {
          const html = new DOMParser().parseFromString(responseText, 'text/html');
          const currHtml = html.querySelector('#compare-product-organizer > div');
          
          this.setAppendColumn(currHtml);
      })
      .finally(() => {
        this.setCurrentArr(all);
      });
    }
    
    setAppendColumn(html){
      this.elements.contentGrid.append(html);
    }
    
    setCurrentArr(norm){
      const nextColumnsArr = norm.slice(1);
      this.initRenderProcess(nextColumnsArr);
    }
    
    setSameheightRows(){
      const rows = this.querySelectorAll('.compare-product_row');
      let height = 0;
      
      for (let i = 0; i < rows.length; i++) {
        const elementHeight = rows[i].offsetHeight;
        
        if(elementHeight > height){
          height = elementHeight;
        }
      }
      
      for (let i = 0; i < rows.length; i++) {
        rows[i].style.setProperty('--cp-same-height', height + 'px');
      }
    }
  });
}

// tabset
if (!customElements.get('tabset-component')) {
  customElements.define('tabset-component', class TabsetComponent extends HTMLElement {
    constructor() {
      super();
      
      this.tablistNode = this;
      this.tabs = Array.from(this.tablistNode.querySelectorAll('[role=tab]'));
      this.initialize();
      if(this.dataset.editorMode === 'true'){
        document.addEventListener('shopify:block:select', function (event) {
          const target = event.target;
          const parent = target.parentElement;
          if(parent.nodeName !== 'TABSET-COMPONENT') return;
          parent.initialize();
          parent.setSelectedTab(target);
        });
      }
    }
    
    initialize(){
      this.tabpanels = this.tabs.map(tab => document.getElementById(tab.getAttribute('aria-controls')));
      this.tabs.forEach(tab => {
        tab.tabIndex = -1;
        tab.setAttribute('aria-selected', 'false');
        tab.addEventListener('keydown', this.onKeydown.bind(this));
        tab.addEventListener('click', this.onClick.bind(this));
      });

      this.firstTab = this.tabs[0];
      this.lastTab = this.tabs[this.tabs.length - 1];
      this.setSelectedTab(this.firstTab, false);
    }

    setSelectedTab(currentTab, setFocus = true) {
      this.tabs.forEach((tab, index) => {
        const isSelected = currentTab === tab;
        tab.setAttribute('aria-selected', isSelected ? 'true' : 'false');
        tab.tabIndex = isSelected ? 0 : -1;
        this.tabpanels[index].classList.toggle('hidden', !isSelected);
        if (isSelected && setFocus) {
          tab.focus();
        }
      });
    }

    setSelectedToPreviousTab(currentTab) {
      const index = this.tabs.indexOf(currentTab);
      this.setSelectedTab(index === 0 ? this.lastTab : this.tabs[index - 1]);
    }

    setSelectedToNextTab(currentTab) {
      const index = this.tabs.indexOf(currentTab);
      this.setSelectedTab(index === this.tabs.length - 1 ? this.firstTab : this.tabs[index + 1]);
    }

    onKeydown(event) {
      const tgt = event.currentTarget;
      let flag = false;

      switch (event.key) {
        case 'ArrowLeft':
          this.setSelectedToPreviousTab(tgt);
          flag = true;
          break;

        case 'ArrowRight':
          this.setSelectedToNextTab(tgt);
          flag = true;
          break;

        case 'Home':
          this.setSelectedTab(this.firstTab);
          flag = true;
          break;

        case 'End':
          this.setSelectedTab(this.lastTab);
          flag = true;
          break;

        default:
          break;
      }

      if (flag) {
        event.stopPropagation();
        event.preventDefault();
      }
    }

    onClick(event) {
      this.setSelectedTab(event.currentTarget);
    }
  });
}

if (!customElements.get('shipping-bar')) {
  customElements.define('shipping-bar', class ShippingBar extends HTMLElement {
    constructor() {
      super();
    }
    
    connectedCallback(){
      this.setString();
      this.setBar();
    }
    
    setString(){
      const dataRate = Number(this.dataset.amount);
      const rateFactor = Shopify.currency.rate || 1;
      const amountCalc = dataRate * rateFactor;
      const html = this.innerHTML;
      const cartTotals = Number(this.dataset.cartTotals) / 100;
      const amount = (amountCalc - cartTotals) * 100;
      if(amount > 0){
        this.innerHTML = html.replace(/\|\|amount\|\|/g, Shopify.formatMoney(amount, window.money_format));
      } else{
        this.firstElementChild.innerHTML = window.cartStrings.shippingAmount;
      }
      this.threshold = amountCalc;
      this.cartTotals = cartTotals;
    }
    
    setBar(){
      const element = this.querySelector('[data-set="bar"]');
      if(!element) return;
      const percent = (this.cartTotals / this.threshold) * 100;
      element.style.width = percent + '%';
    }
  });
}

if (!customElements.get('checkout-min')) {
  customElements.define('checkout-min', class CheckoutMin extends HTMLElement {
    constructor() {
      super();
      this.checkout = this.onCheckout.bind(this);
    }

    connectedCallback(){
      this.form = this.closest('form');
      this.button = this.querySelector('button');
      if(!this.form || !this.button) return;
      if(this.dataset.minValue === isNaN || this.dataset.cartValue === isNaN) return;
      this.onCheck();
      this.initialize();
    }

    onCheck(){
      this.form.addEventListener('submit', this.checkout);
    }

    initialize(){
      const dataRate = Number(this.dataset.amount);
      const rateFactor = Shopify.currency.rate || 1;
      const amountCalc = dataRate * rateFactor;
      const cartTotals = Number(this.dataset.cartTotals) / 100;
      this.amount = (amountCalc - cartTotals) * 100;
      const element = this.querySelector('.cart-min-value p');
      if(this.amount > 0){
        this.setStatus(false);
        element.classList.remove('hidden');
        element.innerText = element.innerText.replace('[value]', Shopify.formatMoney((amountCalc * 100), window.money_format));
        return;
      }
      element.classList.add('hidden');
      this.setStatus(true);
    }

    onCheckout(event){
      if(this.amount > 0){
        event.preventDefault();
        alert(window.cartStrings.minOrderAlert);
        return;
      }
    }

    setStatus(flag){
      if(flag) return this.button.removeAttribute('disabled');
      this.button.setAttribute('disabled', '');
    }

    removeListener(){
      this.form.removeEventListener('submit', this.checkout);
    }
  });
}