class SearchForm extends HTMLElement {
  constructor() {
    super();
    this.searchTerm = '';
    this.cachedResults = [];
    this.abortController = new AbortController();
    // this.resetButton = this.querySelector('button[type="reset"]');
    this.elements = {
      input: this.querySelector('input[type="search"]'),
      resetBtn: this.querySelector('.search-bar_reset-btn'),
      form: this.querySelector('form'),
      resultsContainer: this.querySelector('.search_results-container'),
      loader: this.querySelector('.search-bar_loader'),
      productResultsContainer: this.querySelector('.search-tab-products_results'),
      collectionResultsContainer: this.querySelector('.search-tab-collections_results'),
      articleResultsContainer: this.querySelector('.search-tab-articles_results')
    }
    
    this.tabsetElements = {
      tabItems: this.querySelectorAll('.search-bar_tabs-list > li > a'),
      tabContents: this.querySelectorAll('.search-tab_content')
    }
    
    this.dataSelectors = {
      products: '.--search-tab-products-data',
      collections: '.--search-tab-collections-data',
      articles: '.--search-tab-articles-data'
    }

    if (this.elements.input) {
      // this.input.form.addEventListener('reset', this.onFormReset.bind(this));
      this.elements.input.addEventListener('input', debounce((event) => {
        this.onChange(event);
      }, 300).bind(this))
    }
    
    this.elements.input.addEventListener('click', this.onInputClick.bind(this));
    
    this.tabsetElements.tabItems.forEach(opener => {
      opener.addEventListener('click', this.openTabContent.bind(this));
    });
    
    document.body.addEventListener('click', this.hideOutside.bind(this));
    this.addEventListener('keyup', (event) => {
      if(event.code.toUpperCase() === 'ESCAPE') this.closeResults();
    });
    
    if(this.elements.resetBtn) this.elements.resetBtn.addEventListener('click', this.resetForm.bind(this));
  }
  
  onInputClick(){
    if(this.cachedResults.length && this.elements.input.value.length > 0){
      this.classList.add('--show-search-results');
    }
  }
  
  hardSubmit(){
    this.elements.form.submit();
  }

  onChange() {
    const inputValueTerm = this.elements.input.value.replace(/\s/g, "");
    
    if(inputValueTerm.length > 0){
      this.searchTerm = this.elements.input.value.trim();
      
      const term = {searchTerm: this.searchTerm};
      
      if (!this.cachedResults || !this.cachedResults.some(key => key.searchTerm === term.searchTerm)) {
        this.elements.form.classList.add('--show-loader');
        
        this.fetchSearchResults(this.searchTerm);
        
        return;
      }
      
      this.getCachedResults(term, this.cachedResults);
      
      return;
    }
    
    this.resetResults();
  }
  
  fetchSearchResults(search){
    fetch(
      `${routes.predictive_search_url}?q=${encodeURIComponent(
        search
      )}&section_id=predictive-search&resources[type]=${this.dataset.searchTypes}`,
      { signal: this.abortController.signal }
    )
    .then((response) => {
      
      if (!response.ok) {
        var error = new Error(response.status);
        console.log(error);
      }

      return response.text();
    })
    .then((text) => {
      const html = new DOMParser().parseFromString(text, 'text/html');
      
      const searchObj = {
        searchTerm: this.searchTerm,
        contentHtml: html
      }
      this.cachedResults.push(searchObj);
      
      this.updateTabsData(html);
      
      this.elements.form.classList.remove('--show-loader');
    })
    .catch((error) => {
      if (error?.code === 20) {
        // Code 20 means the call was aborted
        return;
      }
    })
  }
  
  getCachedResults(data, cache){
    const cacheDataArr = cache;
    const cachedResults = cacheDataArr.find(results => results.searchTerm === data.searchTerm);
    
    this.updateTabsData(cachedResults.contentHtml);
  }
  
  updateTabsData(newHtml){
    this.tabsetElements.tabItems.forEach(items => {
      items.classList.remove('active');
    });
    
    this.tabsetElements.tabContents.forEach(tabs => {
      tabs.classList.remove('--active-tab');
    });
    
    const productsListHtml = newHtml.querySelector(this.dataSelectors.products);
    const collectionsListHtml = newHtml.querySelector(this.dataSelectors.collections);
    const articlesListHtml = newHtml.querySelector(this.dataSelectors.articles);
    
    if(productsListHtml) this.getHtmlToRender(this.elements.productResultsContainer, productsListHtml);
    if(collectionsListHtml) this.getHtmlToRender(this.elements.collectionResultsContainer, collectionsListHtml);
    if(articlesListHtml) this.getHtmlToRender(this.elements.articleResultsContainer, articlesListHtml);
    
    this.dataCheckToActiveTab(productsListHtml, collectionsListHtml, articlesListHtml);
    
    if(this.elements.resultsContainer) this.elements.resultsContainer.classList.remove('--show-loader');
    this.classList.add('--show-search-results');
    
    const hardSubmitBtn = this.querySelectorAll('.predictive-search_show-btn');
    if(hardSubmitBtn){
      hardSubmitBtn.forEach(btnSubmit => {
        btnSubmit.addEventListener('click', this.hardSubmit.bind(this));
      });
    }
  }
  
  dataCheckToActiveTab(product, collection, articles){
    if(product){
      
      if(!product.classList.contains('--no-search-data')){
        this.tabsetElements.tabItems[0].classList.add('active');
        this.tabsetElements.tabItems[0].setAttribute('aria-selected', true);
        this.tabsetElements.tabContents[0].classList.add('--active-tab');
      }
    }
    
    if(collection){
      
      if(product.classList.contains('--no-search-data') && !collection.classList.contains('--no-search-data')){
        this.tabsetElements.tabItems[1].classList.add('active');
        this.tabsetElements.tabItems[1].setAttribute('aria-selected', true);
        this.tabsetElements.tabContents[1].classList.add('--active-tab');
      }
    }
    
    if(articles){
      
      if(product.classList.contains('--no-search-data') && collection.classList.contains('--no-search-data')){
        this.tabsetElements.tabItems[2].classList.add('active');
        this.tabsetElements.tabItems[2].setAttribute('aria-selected', true);
        this.tabsetElements.tabContents[2].classList.add('--active-tab');
      }
    }
  }
  
  getHtmlToRender(selector, newHtml){
    selector.innerHTML = newHtml.outerHTML;
  }
  
  openTabContent(){
    event.preventDefault();
    
    this.tabsetElements.tabItems.forEach(items => {
      items.classList.remove('active');
      items.setAttribute('aria-selected', false);
    });
    
    this.tabsetElements.tabContents.forEach(tabs => {
      tabs.classList.remove('--active-tab');
    });
    
    const url = new URL(event.target.href);
    const ref = url.hash.substring(1)
    const tabc = document.getElementById(ref);
    
    event.target.classList.add('active');
    event.target.setAttribute('aria-selected', true);
    tabc.classList.add('--active-tab');
  }
  
  closeResults(){
    this.classList.remove('--show-search-results');
  }
  
  hideOutside(){
    const target = event.target;
    if (target != this && target.id != 'search-bar' && (!this.contains(event.target)) && this.classList.contains('--show-search-results')){
      this.closeResults();
    }
  }
  
  resetResults(){
    this.classList.remove('--show-search-results');
    this.elements.productResultsContainer.innerHTML = '';
    this.elements.collectionResultsContainer.innerHTML = '';
  }
  
  resetForm(){
    event.preventDefault();
    
    this.closeResults();
    this.elements.form.reset();
    this.elements.productResultsContainer.innerHTML = '';
    this.elements.collectionResultsContainer.innerHTML = '';
    
    this.elements.input.focus();
  }
}
customElements.define('search-form', SearchForm);