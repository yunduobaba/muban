class FiltersForm extends HTMLElement {
  constructor() {
    super();
    this.cachedResults = [];
    
    this.debouncedOnSubmit = debounce((event) => {
      this.onSubmitHandler(event);
    }, 500);
    const filterForm = this.querySelector('form');
    filterForm.addEventListener('input', this.debouncedOnSubmit.bind(this));
    
    const resetBtn = document.querySelectorAll('.filters-form_remove-all');
    if(resetBtn){
      resetBtn.forEach(btn => {
        btn.addEventListener('click', this.resetFilters.bind(this));
      });
    }
    
    if(this.dataset.preserver) window.addEventListener('popstate', this.onHistoryChange.bind(this));
  }
  
  connectedCallback(){
    const form = this.querySelector('form');
    const params = this.createSearchParams(form);
    this.initParams = params ? params : '';

    FiltersForm.checkEmptyURL();
  }
  
  onHistoryChange(){
    if(event.state && this.cachedResults.length === 0){
      const loader = document.querySelector('.filters-grid_loader');
      loader.classList.add('--show-loader');
      
      const searchParams = event.state ? event.state.searchParams : this.initParams;
      const term = {params: searchParams};
      const url = `${window.location.pathname}?section_id=${this.dataset.section}&${searchParams}`;
      this.renderFetch(url, false, searchParams);
      
      return;
    }
    
    if(this.cachedResults && this.cachedResults.length > 0){
      const loader = document.querySelector('.filters-grid_loader');
      loader.classList.add('--show-loader');
      
      const searchParams = event.state ? event.state.searchParams : this.initParams;
      const term = {params: searchParams};
    
      if (this.cachedResults.some(key => key.params === term.params)) {
        this.renderFromCache(this.cachedResults, term, false);
      
      } else{
        const url = `${window.location.pathname}?section_id=${this.dataset.section}&${searchParams}`;
        this.renderFetch(url, false, searchParams);
      }
    }
  }
  
  onSubmitHandler(){
    const loader = document.querySelector('.filters-grid_loader');
    loader.classList.add('--show-loader');
    
    const searchParams = this.createSearchParams(this.querySelector('form'));
    const url = `${window.location.pathname}?section_id=${this.dataset.section}&${searchParams}`;
    const term = {params: searchParams};
    
    if (this.cachedResults.length > 0 && this.cachedResults.some(key => key.params === term.params)) {
      this.renderFromCache(this.cachedResults, term, true);
      
      return;
    }
    
    this.renderFetch(url, true, searchParams);
  }

  renderFetch(url, updateURLHash = false, searchParams){
    fetch(url)
      .then(response => response.text())
      .then((responseText) => {
        const html = responseText;

        this.renderProductGridContainer(html);
        this.renderActiveFiltersContainer(html);
        if(this.dataset.updateSelf === 'true') this.renderActiveCounts(html);
        
        if(this.dataset.updateSelf === 'true'){
          this.renderFiltersList(html, true);
        
        } else{
          this.renderFiltersList(html);
        }
        
        const cacheObj = {params: searchParams, content: html};
        this.cachedResults.push(cacheObj);
        this.renderPriceUpdates(html);
      })
      .catch((error) => {
        console.log(error);
      })
      .finally(() => {
        const loader = document.querySelector('.filters-grid_loader');
        loader.classList.remove('--show-loader');
        
        if(updateURLHash) this.updateURLHash(searchParams);
      });
  }
  
  renderFromCache(cache, filter, updateURLHash = false){
    const cacheDataArr = cache;
    const cachedResults = cacheDataArr.find(results => results.params === filter.params);
    const html = cachedResults.content;
    
    this.renderProductGridContainer(html);
    this.renderActiveFiltersContainer(html);
    if(this.dataset.updateSelf === 'true') this.renderActiveCounts(html);
        
    if(this.dataset.updateSelf === 'true'){
      this.renderFiltersList(html, true);
    
    } else{
      this.renderFiltersList(html);
    }
    
    this.renderPriceUpdates(html);
    const loader = document.querySelector('.filters-grid_loader');
    loader.classList.remove('--show-loader');
    
    if(updateURLHash) this.updateURLHash(filter.params);
  }

  createSearchParams(form) {
    const rangeSlider = document.querySelector('range-slider');
    const formData = new FormData(form);
    
    if(!rangeSlider) return new URLSearchParams(formData).toString();
    
    if(rangeSlider.dataset.load === 'false'){
      const gte = rangeSlider.querySelector('.min');
      const lte = rangeSlider.querySelector('.max');
      formData.delete(gte.getAttribute('name'));
      formData.delete(lte.getAttribute('name'));
    }
    return new URLSearchParams(formData).toString();
  }

  renderProductGridContainer(html){
    document.getElementById('filters-grid').innerHTML = new DOMParser().parseFromString(html, 'text/html').getElementById('filters-grid').innerHTML;
  }

  renderPriceUpdates(html){
    const priceRange = document.getElementById('price-range');
    if(!priceRange) return;
    
    const newHtml = new DOMParser().parseFromString(html, 'text/html').getElementById('price-range');
    const newInputs = newHtml.querySelectorAll('input');
    const newCounts = newHtml.querySelector('.range_wrapper');
    const oldInputs = document.querySelectorAll('#price-range input');
    const oldCounts = document.querySelector('#price-range .range_wrapper');
    
    oldCounts.innerHTML = newCounts.innerHTML;
    oldInputs.forEach((input, index) => {
      input.value = newInputs[index].value;
    });
  }

  renderActiveFiltersContainer(html){
    document.querySelector('.filters-head').innerHTML = new DOMParser().parseFromString(html, 'text/html').querySelector('.filters-head').innerHTML;
  }

  renderActiveCounts(html){
    document.querySelector('.filter-header_results-text').innerHTML = new DOMParser().parseFromString(html, 'text/html').querySelector('.filter-header_results-text').innerHTML;
  }

  renderFiltersList(html, collapsible = null){
    let filterWidgets = document.querySelectorAll('.filter-widget--list');
    let selector = '.filter-widget--list';
    if(collapsible){
      filterWidgets = document.querySelectorAll('.filter-widget--update');
      selector = '.filter-widget--update';
    }
    
    filterWidgets.forEach((widget, index) => {
      widget.innerHTML = new DOMParser().parseFromString(html, 'text/html').querySelectorAll(selector)[index].innerHTML;
    });
  }
  
  updateURLHash(searchParams) {
    if(!searchParams) searchParams = this.initParams;
    
    history.pushState({ searchParams }, '', `${window.location.pathname}${searchParams && '?'.concat(searchParams)}`);
  }
  
  resetFilters(){
    event.preventDefault();
    let filterForm = document.querySelector('filters-form[data-preserver="true"] form');
    const inputs = filterForm.querySelectorAll('input');
    
    inputs.forEach(input => {
      input.checked = false;
      input.removeAttribute('checked');
    });
    
    const priceRange = document.querySelector('range-slider');
    if(priceRange) priceRange.resetRanges();
    
    filterForm.reset();
    filterForm.dispatchEvent(new Event('input'));
  }

  static checkEmptyURL(){
    const activeFacet = document.querySelector('button-filter-remove');
    if(activeFacet){
      const filters = document.querySelector('[data-check-on-empty]');
      if(filters){
        filters.removeAttribute('hidden');
        if(filters.previousElementSibling) filters.previousElementSibling.classList.remove('--hide-separator');
      }
    }
  }
}
customElements.define('filters-form', FiltersForm);

class RangeSlider extends HTMLElement {
  constructor() {
    super();
    
    this.inputs = this.querySelectorAll('input[type="range"]');
    
    if(this.inputs){
      this.inputs.forEach(input => {
        input.addEventListener('input', this.onSlideWatch.bind(this));
      });
    }
  }
  
  onSlideWatch(){
    const minInput = this.querySelector('.min');
    const maxInput = this.querySelector('.max');
    const rangeMin = this.querySelector('.range_min');
    const rangeMax = this.querySelector('.range_max');
    
    var minVal = minInput.value;
    var maxVal = maxInput.value;

    if(minInput && minVal > maxVal-0){
      minInput.value = maxVal-0;
    }
    var minVal = parseFloat(minInput.value);
    const finalMinVal = minVal * 100;
    rangeMin.innerText = Shopify.formatMoney(finalMinVal, window.money_format);

    if(maxInput && maxVal-0 < minVal){
      maxInput.value = 0+ minVal;
    }
    var maxVal = parseFloat(maxInput.value);
    const finalMaxVal = maxVal * 100;
    rangeMax.innerText = Shopify.formatMoney(finalMaxVal, window.money_format);
    
    this.setAttribute('data-load', true);
  }
  
  resetRanges(){
    const minInput = this.querySelector('.min');
    const maxInput = this.querySelector('.max');
    const rangeMin = this.querySelector('.range_min');
    const rangeMax = this.querySelector('.range_max');
    
    var minVal = minInput.min;
    var maxVal = maxInput.max;
    
    minInput.value = minVal;
    maxInput.value = maxVal;
    rangeMin.innerText = Shopify.formatMoney(minVal * 100, window.money_format);
    rangeMax.innerText = Shopify.formatMoney(maxVal * 100, window.money_format);
    
    this.setAttribute('data-load', false);
  }
}
customElements.define('range-slider', RangeSlider);

class ButtonFilterRemove extends HTMLElement {
  constructor() {
    super();
    
    this.button = this.querySelector('button');
    this.button.addEventListener('click', this.submitRemoval.bind(this));
  }
  
  submitRemoval(){
    if(!this.dataset.for) return;
    
    const ref = this.dataset.for;
    const input = document.getElementById(ref);
    let filterForm = document.querySelector('.filters-sidebar form');
    if(this.dataset.updateId) filterForm = document.querySelector(`#${this.dataset.updateId}`);
    
    if(!input || !filterForm) return;
    
    if(ref === 'price-range'){
      const priceRange = document.getElementById(ref);
      priceRange.resetRanges();
      filterForm.dispatchEvent(new Event('input'));
      
      return;
    }
    
    input.checked = false;
    input.removeAttribute('checked');
    filterForm.dispatchEvent(new Event('input'));
  }
}
customElements.define('button-filter-remove', ButtonFilterRemove);