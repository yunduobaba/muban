// product card individual element 
if (!customElements.get('product-card')) {
  customElements.define('product-card', class ProductCard extends HTMLElement {
    constructor() {
      super();
      
      this.data = this.querySelector('[type="application/json"]');
      this.variantDataCase = this.dataset.variantShowCase;
      this.dataPrefix = this.dataset.prefix;
      this.elements = {
        priceElem: this.querySelector('[data-request-contents="price"]'),
        priceDup: this.querySelector(`.${this.dataPrefix}price-duplicator`),
        saleTag: this.querySelector('[data-request-contents="sale-tag"]'),
        formElems: this.querySelectorAll('form:not([action*="contact"])'),
        submitFormElem: this.querySelector(`.${this.dataPrefix}form:not([class*="installment"]):not([action*="contact"])`),
        thumbnailGallery: this.querySelector(`.${this.dataPrefix}thumbnail-switcher`),
        loader: this.querySelectorAll(`.${this.dataPrefix}loader`),
        addToCartButton: this.querySelectorAll('button[name="add"]') || this.querySelectorAll('button[type="submit"]'),
        cartInvertoryOrganizer: document.querySelector('cart-inventory-organizer'),
        inCartElem: this.querySelector(`.${this.dataPrefix}in-cart`),
        cartShower: document.querySelector('[data-action="cart-drawer"]'),
        quantityInput: this.querySelector('quantity-input'),
        shareUrlInput: this.querySelector(`.shareUrl`),
        inventory: this.querySelector(`[data-request-contents="inventory"]`),
        sku: this.querySelector(`.${this.dataPrefix}sku`),
        variantsContainer: this.querySelector('product-card-variants'),
        variantColorsContainer: this.querySelector('product-card-colors'),
        pickUpAvailability: this.querySelector(`[data-request-contents="pickup"]`),
        staticGalleryItem: this.querySelector(`.${this.dataPrefix}static-gallery`),
        variantsDrawerOpener: this.querySelectorAll(`.${this.dataPrefix}variants-toggler`),
        variantsDrawer: this.querySelector(`.${this.dataPrefix}variation-drawer`),
        stockBar: this.querySelector(`[data-request-contents="stockbar"]`),
        unitPrice: this.querySelector(`[data-request-contents="unit-price"]`),
        statckedThumbnails: this.querySelectorAll('.product-gallery-thumbnail'),
        bundleCheckCardLabel: this.querySelector('.bundle-check-product'),
        cardInventory: this.querySelector(`[data-request-contents="inventory-card"]`),
        galleryThumbnails: this.querySelector(`.${this.dataPrefix}gallery-thumbnails`),
        errorsContainer: this.querySelector(`.${this.dataPrefix}errors`)
      }
      this.staticSelectors = {
        inputRadio: 'input[type="radio"]',
        option: 'option',
        inputVariantId: 'input[name="id"]',
        selects: 'select',
        scripTag: '[type="application/json"]',
        pickUp: `[data-request-contents="pickup"]`,
        inventory: `[data-request-contents="inventory"]`,
        staticGalleryThumbItem: `.product_gallery-item:not(.product_gallery-item--variant)`,
        staticGalleryVariantItem: '.product_gallery-item--variant',
        price: '[data-request-contents="price"]',
        priceTag: '[data-request-contents="sale-tag"]',
        variantRows: `.${this.dataPrefix}variant-row`,
        priceDuplicator: `.${this.dataPrefix}price-duplicator`,
        stockStatuesBar: '[data-request-contents="stockbar"]',
        unitPricing: '[data-request-contents="unit-price"]',
        inventCard: '[data-request-contents="inventory-card"]',
      }
      
      if(this.elements.variantsDrawerOpener){
        this.elements.variantsDrawerOpener.forEach(element => {
          element.addEventListener('click', this.openVariantDrawer.bind(this, event))
        });
      };
      if(this.elements.variantColorsContainer) this.elements.variantColorsContainer.addEventListener('change', this.onVariantColorChange.bind(this, event));
      if(this.elements.variantsContainer) this.elements.variantsContainer.addEventListener('change', this.onVariantChange.bind(this, event));
      if(this.elements.submitFormElem) this.elements.submitFormElem.addEventListener('submit', this.onsubmitHandler.bind(this));
      if(this.elements.bundleCheckCardLabel) this.elements.bundleCheckCardLabel.addEventListener('click', this.onBundleCheckLabel.bind(this));
    }
    
    connectedCallback(){
      if(!this.data) return;
      this.data = JSON.parse(this.data.textContent);
      if(this.dataset.swatchImages === 'true') this.setSwatchImages();
    }

    setSwatchImages(){
      const optionsArr = this.data.options;
      if(!optionsArr.includes('Color') && !optionsArr.includes('color') && !optionsArr.includes('Colour') && !optionsArr.includes('colour')) return;
      if(optionsArr.length === 1){
        const containers = [this.querySelector('product-card-variants'), this.querySelector('product-card-colors')];
        containers.forEach(container => {
          const labels = container.querySelectorAll('label');
          labels.forEach((label, index) => {
            label.classList.add('--swatch-image');
            const variant = this.data.variants[index];
            const featuredMedia = variant && variant.featured_media ? variant.featured_media : null;
            if(!featuredMedia) {
              label.style.backgroundImage = "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAATCAYAAACdkl3yAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAABdaVRYdFNuaXBNZXRhZGF0YQAAAAAAeyJjbGlwUG9pbnRzIjpbeyJ4IjowLCJ5IjowfSx7IngiOjE4LCJ5IjowfSx7IngiOjE4LCJ5IjoxOX0seyJ4IjowLCJ5IjoxOX1dfetuk4EAAAEmSURBVDhPlZPLkkZADIXT2LGywBPg/dfKE1hT3gDFRllYMXMyf7rCjMt8VS0tlyNCm7Isd1Ls+05xHFOaph/PkWEYqK5r8jyPjDGcDxy+OGwYBCR4B0Q0VuEceIvUsZDu4r+C9tWw2bbNimH/BuTpOlNV1a9h+75PYRgeZgcQW5aFpmnimB62Wdd1F4fYvu+pbVtyXZeTBHQQRRHleW4FhG/hH+WzlXW+1/7D+ghegiKgO/6LRyEgXdzxKIQOrrrQXAqJgF4Y9lVnZhxH+zgkg3me+UzJoMUPGwQBn0UtCL8pioKzdHKSJJRlGd8DEYPtuo6aprG/htQ5CMKpF3x6AbHSJayuYSFJAvKEJ3QNePX577Cd4vK2C43U2Blho0/xW46nf6cv9tXO7HWOFxkAAAAASUVORK5CYII=')";
              label.classList.add('--swatch-placeholder');
              return;
            }
            label.style.backgroundImage = `url(${featuredMedia.preview_image.src})`;
          });
        });
      } else{
        const variants = this.getPairOptions();
        const labels = this.querySelectorAll('product-card-variants .variant-row--pills-color label');
        const colorLabels = this.querySelectorAll('product-card-colors label');
        setImage(labels);
        setImage(colorLabels);

        function setImage(arr){
          arr.forEach((label, index) => {
            label.classList.add('--swatch-image');
            const variant = variants[index];
            const featuredMedia = variant && variant.featured_media ? variant.featured_media : null;
            if(!featuredMedia) {
              label.style.backgroundImage = "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAATCAYAAACdkl3yAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAABdaVRYdFNuaXBNZXRhZGF0YQAAAAAAeyJjbGlwUG9pbnRzIjpbeyJ4IjowLCJ5IjowfSx7IngiOjE4LCJ5IjowfSx7IngiOjE4LCJ5IjoxOX0seyJ4IjowLCJ5IjoxOX1dfetuk4EAAAEmSURBVDhPlZPLkkZADIXT2LGywBPg/dfKE1hT3gDFRllYMXMyf7rCjMt8VS0tlyNCm7Isd1Ls+05xHFOaph/PkWEYqK5r8jyPjDGcDxy+OGwYBCR4B0Q0VuEceIvUsZDu4r+C9tWw2bbNimH/BuTpOlNV1a9h+75PYRgeZgcQW5aFpmnimB62Wdd1F4fYvu+pbVtyXZeTBHQQRRHleW4FhG/hH+WzlXW+1/7D+ghegiKgO/6LRyEgXdzxKIQOrrrQXAqJgF4Y9lVnZhxH+zgkg3me+UzJoMUPGwQBn0UtCL8pioKzdHKSJJRlGd8DEYPtuo6aprG/htQ5CMKpF3x6AbHSJayuYSFJAvKEJ3QNePX577Cd4vK2C43U2Blho0/xW46nf6cv9tXO7HWOFxkAAAAASUVORK5CYII=')";
              label.classList.add('--swatch-placeholder');
              return;
            }
            label.style.backgroundImage = `url(${featuredMedia.preview_image.src})`;
          });
        }
      }
    }

    getPairOptions(){
      const rows = this.querySelectorAll(`product-card-variants .variant-row--pills:not(.variant-row--pills-color)`);
      const variantDataRows = Array.from(rows);
      const options = variantDataRows.map((rowSet) => {
        return Array.from(rowSet.querySelectorAll(this.staticSelectors.inputRadio)).find((radio) => radio.checked).value;
      });
      const variants = this.getPairedVariants(options);
      return variants;
    }

    getPairedVariants(optionsToMatch){
      return this.data.variants.filter(variant =>
        optionsToMatch.every(option =>
          variant.options.includes(option)
        )
      );
    }
    
    openVariantDrawer(){
      event.preventDefault();
      const variants = this.querySelector('.product_variation-wrap');
      
      if(this.classList.contains('--drawer-active')){
        variants.removeAttribute('tabindex');
        this.classList.remove('--drawer-active');
      
      } else{
        this.classList.add('--drawer-active');
        variants.setAttribute('tabindex', '-1');
        variants.focus();
      }
    }
    
    onsubmitHandler(){
      event.preventDefault();
      this.updateSubmitButton(false);
      this.setLoaderActivity(true);
      
      const config = fetchConfig('javascript');
      config.headers['X-Requested-With'] = 'XMLHttpRequest';
      delete config.headers['Content-Type'];
      
      const formData = new FormData(this.elements.submitFormElem);
      formData.append('sections', this.getSectionsToRender().map((section) => section.id));
      formData.append('sections_url', window.location.pathname);
      config.body = formData;
      
      fetch(`${routes.cart_add_url}`, config)
      .then((response) => response.json())
      .then((response) => {
        this.hasError = false;
        this.handleErrors(response);
        
        publish(PUB_SUB_EVENTS.cartError, {source: `.${this.dataPrefix}form:not([class*="installment"]):not([action*="contact"])`, productVariantId: formData.get('id'), errors: response.description, message: response.message});
        
        if(!this.hasError){
          this.getSectionsToRender().forEach((section => {
            const sectionElement = section.selector ? document.querySelector(section.selector) : document.getElementById(section.id);
            sectionElement.innerHTML = this.getSectionInnerHTML(response.sections[section.id], section.selector);
          }));
        }
        
        const cartItemQty = response.quantity;
        this.elements.cartInvertoryOrganizer.setCartUpdates(cartItemQty, this.elements.inCartElem);
        const minCartElem = document.querySelectorAll('checkout-min');
        if(minCartElem.length > 0){
          minCartElem.forEach(checkoutMin => {
            checkoutMin.removeListener();
          });
        }
      })
      .catch((e) => {
        console.error(e);
        this.hasError = true;
      })
      .finally(() => {
        if(this.elements.quantityInput){
          var currPrice = this.getCurrentPriceData();
          this.elements.quantityInput.resetDefaults(currPrice);
        }
        const minCartElem = document.querySelectorAll('checkout-min');
        if(minCartElem.length > 0){
          minCartElem.forEach(checkoutMin => {
            checkoutMin.onCheck();
            checkoutMin.initialize();
          });
        }
        this.updateSubmitButton(true);
        this.setLoaderActivity(false);
        if(!this.hasError){
          this.elements.cartInvertoryOrganizer.updateBubbleStatus();
          const recipientForm = this.querySelector('recipient-form');
          if(recipientForm) recipientForm.clearInputFields(true);
          
          const isMainCart = document.getElementById('main-cart');
          const isCartEmpty = document.querySelector('.empty_case');
          if(isMainCart){
            const cartItemRow = document.querySelector('cart-item-row');
            const cartItemRowId = cartItemRow.dataset.id;
            const cartItemRowQty = cartItemRow.input.value;
            
            if(isCartEmpty){
              cartItemRow.setRenderChanges(cartItemRowId, cartItemRowQty, true);
              
              return;
            }
            if(cartItemRow) cartItemRow.setRenderChanges(cartItemRowId, cartItemRowQty);
            
            return;
          }
          if(this.elements.cartShower) this.elements.cartShower.open();
        }
      });
    }
    
    handleErrors(response){
      if(!this.elements.errorsContainer) return;
      if(response.quantity === 0) return this.hasError = true;
      
      this.elements.errorsContainer.classList.add('hidden');
      this.elements.errorsContainer.innerText = '';
      const recipientForm = this.querySelector('recipient-form');
      if(recipientForm) recipientForm.clearErrorMessage();
      
      if(response.message){
        this.hasError = true;
        let message = response.description;
        
        if(typeof(response.description) === 'object'){
          message = response.message;
          if(recipientForm) recipientForm.displayErrorMessage(message, response.errors);
        }
        
        this.elements.errorsContainer.classList.remove('hidden');
        this.elements.errorsContainer.innerText = message;
        
        if(!this.classList.contains('main-product-card')){
          setTimeout(() => {
            this.elements.errorsContainer.classList.add('hidden');
          }, 3500);
        }
      }
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

    getSectionInnerHTML(html, selector = '.shopify-section') {
      return new DOMParser() .parseFromString(html, 'text/html') .querySelector(selector).innerHTML;
    }

    onVariantColorChange(backflow = false){
      if(backflow){
        const colorsArr = Array.from(this.elements.variantColorsContainer.querySelectorAll('input'));
        colorsArr.map((input, index) => {
          const ids = input.id.replace('-colors', '');
          const correspondingElement = document.querySelector(`#${ids}`);
          const labelText = colorsArr[index].querySelector('.label-text-sibling');
          if(correspondingElement.checked) colorsArr[index].checked = true;
          if(correspondingElement.classList.contains('disabled')){
            colorsArr[index].classList.add('disabled');
            if(labelText){
              labelText.classList.remove('hidden');
              labelText.classList.add('visually-hidden');
            }
          } else {
            colorsArr[index].classList.remove('disabled');
            if(labelText){
              labelText.classList.add('hidden');
              labelText.classList.remove('visually-hidden');
            }
          }
        });
        return;
      }
      const inputCurr = event.target;
      const inputRef = inputCurr.id;
      const inputId = inputRef.endsWith('-colors') ? inputRef.slice(0, -7) : null;
      if(!inputId) return
      document.getElementById(inputId).checked = true;
      this.onVariantChange();
    }
    
    onVariantChange(){
      this.setLoaderActivity(true);
      this.getSelectedVarintOptions();
      this.selectedVariantData();
      
      if(this.currentVariant === undefined){
        this.updateVariantStatuses();
        this.setUnavailableStatuses(true);
      } else{
        this.updateVariantInput();
        this.updateVariantSku();
        this.updateVariantStatuses();
        this.setUnavailableStatuses(false);
        this.updateMedia();
        this.setQtyRules();
        this.updateShareUrl();
        this.renderChangesUpdates();
        this.updateURL();
      }
      
      if(this.dataset.exceptQuery){
        this.setAttribute('data-bundle-included', true);
        this.onBundleCheckLabel();
      }

      if(this.dataset.swatchImages === 'true') this.setSwatchImages();
    }
    
    setUnavailableStatuses(status){
      if(status){
        if(this.elements.priceElem) this.elements.priceElem.classList.add('hidden');
        if(this.elements.saleTag) this.elements.saleTag.classList.add('hidden');
        if(this.elements.priceDup) this.elements.priceDup.classList.add('hidden');
        if(this.elements.cardInventory){
          this.elements.cardInventory.innerHTML = '';
          this.elements.cardInventory.parentElement.classList.add('hidden');
          this.elements.cardInventory.classList.add('hidden');
        }
        if(this.elements.inventory) this.elements.inventory.classList.add('hidden');
        if(this.elements.stockBar){
          this.elements.stockBar.classList.add('hidden');
          this.elements.stockBar.innerHTML = '';
        }
        if(this.elements.pickUpAvailability) this.elements.pickUpAvailability.classList.add('hidden');
        if(this.elements.unitPrice) this.elements.unitPrice.classList.add('hidden');
        if(this.elements.quantityInput) this.elements.quantityInput.toggleSubtotal(false);
        this.updateSubmitButton(false, window.variantStrings.unavailable);
        this.setLoaderActivity(false);
      } else{
        if(this.elements.priceElem) this.elements.priceElem.classList.remove('hidden');
        if(this.elements.saleTag) this.elements.saleTag.classList.remove('hidden');
        if(this.elements.priceDup) this.elements.priceDup.classList.remove('hidden');
        if(this.elements.pickUpAvailability) this.elements.pickUpAvailability.classList.remove('hidden');
        if(this.elements.unitPrice) this.elements.unitPrice.classList.remove('hidden');
        if(this.elements.quantityInput) this.elements.quantityInput.toggleSubtotal(true);
      }
    }
    
    onBundleCheckLabel(){
      this.elements.bundleCheckCardLabel.classList.add('--disabled');
      if(!this.currentVariant){
        this.getSelectedVarintOptions();
        this.selectedVariantData();
      }
      if(this.currentVariant && this.currentVariant.available) this.elements.bundleCheckCardLabel.classList.remove('--disabled');
      
      if (!this.currentVariant){
        this.currentVariant = null;
        const checkRows = this.querySelector(this.staticSelectors.variantRows);
        
        if(this.data.available && !checkRows){
          this.elements.bundleCheckCardLabel.classList.remove('--disabled');
        }
      }
      
      if(!this.data.requires_selling_plan){
        if(this.dataset.bundleIncluded === 'true'){
          this.setAttribute('data-bundle-included', false);
        
        } else{
          this.setAttribute('data-bundle-included', true);
          this.elements.bundleCheckCardLabel.classList.remove('--disabled');
        }
      } else{
        this.setAttribute('data-bundle-included', false);
        this.elements.bundleCheckCardLabel.classList.add('--disabled');
      }
      
      const bundleContainer = document.querySelector('bundle-product-wrapper');
      bundleContainer.initBundleCheck();
    }
    
    renderChangesUpdates(){
      fetch(`${this.dataset.url}?variant=${this.currentVariant.id}&section_id=${this.dataset.id}`)
      .then((response) => response.text())
      .then((responseText) => {
        const html = new DOMParser().parseFromString(responseText, 'text/html');
        
        if(this.elements.unitPrice) this.setSectionRenderChanges(html, this.staticSelectors.unitPricing, this.elements.unitPrice);
        if(this.elements.priceElem) this.setSectionRenderChanges(html, this.staticSelectors.price, this.elements.priceElem);
        if(this.elements.priceDup) this.setSectionRenderChanges(html, this.staticSelectors.price, this.elements.priceDup);
        if(this.elements.saleTag) this.setSectionRenderChanges(html, this.staticSelectors.priceTag, this.elements.saleTag);
        
        if(this.elements.inventory){
          if(this.currentVariant.inventory_management === 'shopify'){
            this.elements.inventory.classList.remove('hidden');
          
          } else{
            this.elements.inventory.classList.add('hidden');
          }
          
          this.setSectionRenderChanges(html, this.staticSelectors.inventory, this.elements.inventory);
        }
        if(this.elements.stockBar){
          if(this.currentVariant.inventory_management === 'shopify'){
            this.elements.stockBar.classList.remove('hidden');
          
          } else{
            this.elements.stockBar.classList.add('hidden');
            this.elements.stockBar.innerHTML = '';
          }
          
          this.setSectionRenderChanges(html, this.staticSelectors.stockStatuesBar, this.elements.stockBar);
        }
        if(this.elements.cardInventory){
          if(this.currentVariant.inventory_management === 'shopify'){
            this.elements.cardInventory.parentElement.classList.remove('hidden');
            this.elements.cardInventory.classList.remove('hidden');
          
          } else{
            this.elements.cardInventory.parentElement.classList.add('hidden');
            this.elements.cardInventory.classList.add('hidden');
          }
          this.setSectionRenderChanges(html, this.staticSelectors.inventCard, this.elements.cardInventory);
        }
        if(this.elements.pickUpAvailability) this.setSectionRenderChanges(html, this.staticSelectors.pickUp, this.elements.pickUpAvailability);
      })
      .catch((e) => {
        console.error(e);
        throw e;
      })
      .finally(() => {
        if(this.elements.pickUpAvailability){
          const scheme = this.querySelector('[data-pickup-bg-scheme]');
          const drawer = this.querySelector('.modal-component--pickup-drawer');
          if(drawer) drawer.classList.add(scheme.dataset.pickupBgScheme);
        }
        if(this.elements.quantityInput){
          this.elements.quantityInput.validateQtyRules(this.currentVariant.quantity_rule);
        }
        
        // if(this.elements.inventory) this.elements.inventory.classList.remove('--show-loader');
        // if(this.elements.priceElem) this.elements.priceElem.classList.remove('--show-loader');
        // if(this.elements.saleTag) this.elements.saleTag.classList.remove('--show-loader');
        this.setLoaderActivity(false);
      });
    }
    
    setSectionRenderChanges(newHtml, name, selector){
      const newSource = newHtml.querySelector(name);
      selector.innerHTML = newSource.innerHTML;
    }
    
    setQtyRules(variantId = null){
      if(variantId){
        this.currentVariant = {};
        this.currentVariant.id = parseInt(variantId);
      }
      
      if(!this.currentVariant.id) return;
      
      const activeInCart = this.elements.cartInvertoryOrganizer.getPurposalDetails(this.currentVariant.id);
      if(activeInCart){
        this.elements.cartInvertoryOrganizer.setCartUpdates(activeInCart.quantity, this.elements.inCartElem);
      
      } else{
        this.elements.cartInvertoryOrganizer.setCartUpdates(0, this.elements.inCartElem);
      }
    }
    
    getSelectedVarintOptions(){
      if(this.variantDataCase == 'radio'){
        this.variantRows = this.querySelectorAll(`product-card-variants ${this.staticSelectors.variantRows}`);
        
        const variantDataRows = Array.from(this.variantRows);
        this.options = variantDataRows.map((rowSet) => {
          return Array.from(rowSet.querySelectorAll(this.staticSelectors.inputRadio)).find((radio) => radio.checked).value;
        });
        
        return;
      }
    }

    selectedVariantData() {
      if(this.variantRows.length == 1){
        const currentVariants = this.data.variants.filter((variant) => variant.options.find((x) => x === this.options[0]));
        this.currentVariant = currentVariants.find((variant) => variant.available)
        if(!this.currentVariant) this.currentVariant = currentVariants[0];
        
        return;
      }
      
      this.currentVariant = this.data.variants.find((variant) => {
        return !variant.options.map((option, index) => {
          return this.options[index] === option;
        }).includes(false);
      });
    }

    updateVariantInput() {
      this.elements.formElems.forEach((productForm) => {
        const input = productForm.querySelector(this.staticSelectors.inputVariantId);
        input.value = this.currentVariant.id;
        // input.dispatchEvent(new Event('change', { bubbles: true }));
      });
    }

    updateVariantSku() {
      if(!this.elements.sku || !this.currentVariant) return;
      const skuParent = this.querySelector('[data-parent="sku"]');
      
      if(!this.currentVariant.sku){
        skuParent.classList.add('hidden');
      
      } else{
        skuParent.classList.remove('hidden');
      }
      
      this.elements.sku.textContent = this.currentVariant.sku;
    }

    updateMedia() {
      if (!this.currentVariant) return;
      if (!this.currentVariant.featured_media){
        if(this.elements.staticGalleryItem) this.elements.staticGalleryItem.classList.remove('--show-only-variant');
        if(this.querySelector(this.staticSelectors.staticGalleryVariantItem)) this.querySelector(this.staticSelectors.staticGalleryVariantItem).classList.remove('--active');
        
        return
      }
      
      if(this.currentVariant.featured_media && this.dataset.mediaGallery == 'static'){
        const originalUrl = this.currentVariant.featured_media.preview_image.src;
        let imageUrl = originalUrl.replace(/^(http:|https:)/, "");
        imageUrl += `&width=${this.currentVariant.featured_media.preview_image.width}`;
        const newImageUrl = imageUrl;
        const imageWidth = this.currentVariant.featured_media.preview_image.width;
        const imageHeight = this.currentVariant.featured_media.preview_image.height;
        const imageRatio = this.currentVariant.featured_media.preview_image.aspect_ratio;
        
        if(!this.elements.staticGalleryItem || !this.querySelector(this.staticSelectors.staticGalleryVariantItem)) return;
        
        const mediaContainer = this.elements.staticGalleryItem;
        const imageContainer = this.querySelector(this.staticSelectors.staticGalleryVariantItem);
        const imageSrc = imageContainer.querySelector('img');
        
        imageSrc.setAttribute('src', newImageUrl);
        const srcset = imageSrc.srcset;
        const newSrcset = `${newImageUrl}&width=576 576w, ${newImageUrl}&width=768 768w, ${newImageUrl}&width=992 992w, ${newImageUrl}&width=1200 1200w, ${newImageUrl}&width=1440 1440w, ${newImageUrl}&width=1946 1946w`;
        imageSrc.setAttribute('srcset', newSrcset);
        imageSrc.setAttribute('width', imageWidth);
        imageSrc.setAttribute('height', imageHeight);
        
        mediaContainer.classList.add('--show-only-variant');
        imageContainer.style.setProperty('--aspect-ratio', imageRatio);
        imageContainer.classList.add('--active');
        
        return;
      }

      if(this.elements.thumbnailGallery) {
        const splideMediaId = this.currentVariant.featured_media.id;
        this.setActiveSplideThumbnail(this.elements.thumbnailGallery, splideMediaId);
      }
      if(this.elements.galleryThumbnails) this.elements.galleryThumbnails.classList.remove('--variant-thumb-active');
      
      if(this.currentVariant.featured_media && this.elements.galleryThumbnails){
        this.elements.galleryThumbnails.classList.add('--variant-thumb-active');
        
        this.elements.statckedThumbnails.forEach(thumb => {
          thumb.classList.remove('--active-thumb');
          
          if(thumb.dataset.mediaId == this.currentVariant.featured_media.id){
            thumb.classList.add('--active-thumb');
          }
        });
      }
    }
    
    setActiveSplideThumbnail(thumbnail, mediaId) {
      if (!thumbnail) return;
      
      const splide = thumbnail.splide;
      const thumbnailSlide = splide.Components.Slides.filter(`[data-target="${mediaId}"]`)
      
      if(!thumbnailSlide.length) return;

      splide.go(thumbnailSlide[0].index);
    }

    updateVariantStatuses() {
      const selectedOptionOneVariants = this.data.variants.filter(variant => this.elements.variantsContainer.querySelector(':checked').value === variant.option1);
      const inputWrappers = [...this.variantRows];
      
      inputWrappers.forEach((option, index) => {
        if (index === 0){
          if(this.currentVariant && this.currentVariant.available){
            this.updateSubmitButton(true, window.variantStrings.addToCart);
          
          } else{
            this.updateSubmitButton(false, window.variantStrings.soldOut);
          }
          
          return;
        }
        
        const optionInputs = [...option.querySelectorAll(this.staticSelectors.inputRadio, this.staticSelectors.option)];
        const previousOptionSelected = inputWrappers[index - 1].querySelector(':checked').value;
        const availableOptionInputsValue = selectedOptionOneVariants.filter(variant => variant.available && variant[`option${ index }`] === previousOptionSelected).map(variantOption => variantOption[`option${ index + 1 }`]);
        this.setAvailability(optionInputs, availableOptionInputsValue);
      });
    }

    setAvailability(listOfOptions, listOfAvailableOptions) {
      listOfOptions.forEach(input => {
        const label = input.nextElementSibling;
        const labelText = label.querySelector('.label-text-sibling');
        
        if (listOfAvailableOptions.includes(input.getAttribute('value'))) {
          input.classList.remove('disabled');
          labelText.classList.add('hidden');
          labelText.classList.remove('visually-hidden');
        
        } else {
          input.classList.add('disabled');
          labelText.classList.remove('hidden');
          labelText.classList.add('visually-hidden');
        }

        if(this.elements.variantColorsContainer){
          this.onVariantColorChange(true);
        }
      });
    }
    
    setLoaderActivity(checkStatus){
      
      if(checkStatus){
        // this.elements.loader.classList.add('--show-loader');
        
        this.elements.loader.forEach(loader => {
          loader.classList.add('--show-loader');
        });
        
        // if(this.elements.inventory) this.elements.inventory.classList.add('--show-loader');
        // if(this.elements.pickUpAvailability) this.elements.pickUpAvailability.classList.add('--show-loader');
        // if(this.elements.priceElem) this.elements.priceElem.classList.add('--show-loader');
        // if(this.elements.saleTag) this.elements.saleTag.classList.add('--show-loader');
        
        this.updateSubmitButton(false);
      } else{
        // this.elements.loader.classList.remove('--show-loader');
        
        this.elements.loader.forEach(loader => {
          loader.classList.remove('--show-loader');
        });
      }
    }
    
    updateSubmitButton(checkStatus, labelText = null){
      if(!this.elements.addToCartButton) return;
      
      if(checkStatus){
        
        this.elements.addToCartButton.forEach(button => {
          button.removeAttribute('disabled');
          button.classList.remove('disabled');
          
          if(labelText && button.querySelector('.button--text')) button.querySelector('.button--text').textContent = labelText;
        });
        
        return;
      }
      
      this.elements.addToCartButton.forEach(button => {
        button.setAttribute('disabled', '');
        button.classList.add('disabled');
        
        if(labelText && button.querySelector('.button--text')) button.querySelector('.button--text').textContent = labelText;
      });
    }

    updateURL() {
      if (!this.dataset.updateUrl) return;
      window.history.replaceState({ }, '', `${this.dataset.url}?variant=${this.currentVariant.id}`);
    }

    updateShareUrl() {
      if(!this.elements.shareUrlInput) return;
      const shareUrl = `${window.shopUrl}${this.dataset.url}?variant=${this.currentVariant.id}`;
      this.elements.shareUrlInput.value = shareUrl;
    }
    
    setFromCartUpdates(variantId){
      if(!this.elements.submitFormElem){
        this.elements.cartInvertoryOrganizer.updateBubbleStatus();
        
        return;
      }
      const input = Number(this.elements.submitFormElem.querySelector(this.staticSelectors.inputVariantId));
      if(!input.value || input.value !== variantId) return;
      this.setQtyRules(variantId);
        
      this.elements.cartInvertoryOrganizer.updateBubbleStatus();
    }
    
    getMediaThumbnail(){
      if(!this.currentVariant){
        this.getSelectedVarintOptions();
        this.selectedVariantData();
      }
      
      if (!this.currentVariant || !this.currentVariant.featured_image){
        
        if(this.data.media) return this.data.media[0].preview_image.src;
        
        return this.data.featured_image;
      }
      
      return this.currentVariant.featured_image.src;
    }
    
    getCurrentPriceData(){
      if(!this.currentVariant){
        this.getSelectedVarintOptions();
        this.selectedVariantData();
      }
      
      if (!this.currentVariant) return this.data.price;
      
      return this.currentVariant.price;
    }
  })
}

if (!customElements.get('bundle-product-wrapper')) {
  customElements.define('bundle-product-wrapper', class BundleProductWrapper extends HTMLElement {
    constructor() {
      super();
      
      this.elements = {
        submitButton: this.querySelector('.bundle-cart-sbumit'),
        cartShower: document.querySelector('[data-action="cart-drawer"]'),
        cartInvertoryOrganizer: document.querySelector('cart-inventory-organizer'),
        priceContainer: document.querySelector('.bundle-price'),
        comparePriceContainer: document.querySelector('.bundle-compare-price'),
        thumbsListContainer: this.querySelector('.fbt-items-list')
      }
      
      this.elements.submitButton.addEventListener('click', this.onSubmit.bind(this));
    }
    
    onSubmit(){
      event.preventDefault();
      const productCards = this.querySelectorAll('product-card');
      
      if(productCards){
        const cardsArr = Array.from(productCards);
        
        this.bundleSubmit(cardsArr);
      }
    }
    
    bundleSubmit(productCards){
      if(productCards.length){
        const cardCurr = productCards[0];
        
        if(cardCurr.dataset.bundleIncluded === 'false'){
          this.setCurrentStatuses(productCards);
          
          return;
        }
        this.elements.submitButton.classList.add('--show-loader');
        
        const form = cardCurr.querySelector('form');
        form.removeEventListener('submit', cardCurr.onsubmitHandler);
        form.addEventListener('bundlesubmit', this.addToCartCard(form, productCards));
        
        const submitEvent = new Event('bundlesubmit', { bubbles: true, cancelable: true });
        form.dispatchEvent(submitEvent);
        
        return;
      }
      
      this.elements.submitButton.classList.remove('disabled');
      this.elements.submitButton.classList.remove('--show-loader');
      
      this.elements.cartInvertoryOrganizer.updateBubbleStatus();
      this.showCartShower();
    }
    
    addToCartCard(dataForm, cards){    
      const config = fetchConfig('javascript');
      config.headers['X-Requested-With'] = 'XMLHttpRequest';
      delete config.headers['Content-Type'];
      
      const formData = new FormData(dataForm);
      formData.append('sections', this.getSectionsToRender().map((section) => section.id));
      formData.append('sections_url', window.location.pathname);
      config.body = formData;
      
      fetch(`${routes.cart_add_url}`, config)
      .then((response) => response.json())
      .then((response) => {
        this.getSectionsToRender().forEach((section => {
          const sectionElement = section.selector ? document.querySelector(section.selector) : document.getElementById(section.id);
          sectionElement.innerHTML = this.getSectionInnerHTML(response.sections[section.id], section.selector);
        }));
        
        const cartItemQty = response.quantity;
        this.elements.cartInvertoryOrganizer.setCartUpdates(cartItemQty);
      })
      .catch((e) => {
        console.error(e);
      }).finally(() => {
        this.setCurrentStatuses(cards);
      });
    }
    
    setCurrentStatuses(products){
      const cardCurr = products[0];
      cardCurr.setAttribute('data-bundle-added', true);
      
      const nextCardsArr = products.slice(1);
      this.bundleSubmit(nextCardsArr);
    }
    
    showCartShower(){
      if(this.elements.cartShower) this.elements.cartShower.open();
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

    getSectionInnerHTML(html, selector = '.shopify-section') {
      return new DOMParser() .parseFromString(html, 'text/html') .querySelector(selector).innerHTML;
    }
    
    resetThumbsList(){
      while(this.elements.thumbsListContainer.firstChild){
        this.elements.thumbsListContainer.removeChild(this.elements.thumbsListContainer.firstChild);
      }
    }
    
    initBundleCheck(){
      const bundleCards = this.querySelectorAll('product-card');
      
      if(bundleCards.length){
        let setButton = false;
        let bundlePrice = 0;
        let bundleComparePrice = 0;
        const bundleCounterWrapper = this.querySelector('.bcs-counter-wrap');
        const bundleCount = bundleCounterWrapper.querySelector('.bcs-count');
        let count = bundleCards.length;
        
        this.resetThumbsList();
        
        bundleCards.forEach(product => {              
          if(product.dataset.bundleIncluded === 'true'){
            const mediaThumb = product.getMediaThumbnail();
            const thumbItem = document.createElement("li");
            if(mediaThumb) thumbItem.style.backgroundImage = `url('${mediaThumb}')`;
            this.elements.thumbsListContainer.appendChild(thumbItem);
            bundlePrice += product.currentVariant ? product.currentVariant.price : product.data.price;
            
            if(product.currentVariant){
              bundleComparePrice += product.currentVariant.compare_at_price ? product.currentVariant.compare_at_price : product.currentVariant.price;
              
            } else{
              bundleComparePrice += product.data.compare_at_price ? product.data.compare_at_price : product.data.price;
            }
            
            setButton = true;
            if(setButton) this.elements.submitButton.classList.remove('disabled');
          }
          
          if(product.dataset.bundleIncluded === 'false'){
            count--;
          }
        });
        
        this.elements.priceContainer.innerText = Shopify.formatMoney(bundlePrice, window.money_format);
        
        if(bundleComparePrice > bundlePrice){
          this.elements.comparePriceContainer.classList.remove('hidden');
          this.elements.comparePriceContainer.innerText = Shopify.formatMoney(bundleComparePrice, window.money_format);
        
        } else{
          this.elements.comparePriceContainer.classList.add('hidden');
          this.elements.comparePriceContainer.innerText = Shopify.formatMoney(0, window.money_format);
        }
        
        if(count > 0){
          bundleCount.innerText = count;
          bundleCounterWrapper.classList.remove('hidden');
        
        } else{
          bundleCount.innerText = 0;
          bundleCounterWrapper.classList.add('hidden');
          this.elements.submitButton.classList.add('disabled');
        }
        
        this.classList.remove('visually-hidden');
        this.querySelector('.fbt-products-block_sidewrap').classList.remove('visually-hidden');
      }
    }
  })
}

if (!customElements.get('product-compare-button')) {
  customElements.define('product-compare-button', class ProductCompareButton extends HTMLElement {
    constructor() {
      super();
      
      this.anchor = this.querySelector('a') ? this.querySelector('a') : this.querySelector('button');
      this.anchor.addEventListener('click', this.onCompare.bind(this));
    }
    
    connectedCallback(){
      this.checkComparelistStatus();
    }
    
    onCompare(){
      event.preventDefault();
      if(!this.dataset.handle) return;
      
      const handle = this.dataset.handle;
      const compareListStorage = localStorage.getItem('comparelist');
      const comparelistContainer = document.querySelector('[data-modal-main="compare"]');
      const comparelistOrganizer = document.querySelector('.compare-counter');
      let compareList = compareListStorage ? JSON.parse(compareListStorage) : [];
      const compareLimit = 3;
      
      if(!compareList.includes(handle)){
      
        if(compareList.length && compareList.length >= compareLimit){
          comparelistContainer.classList.add('--limit-exceed');
          
          alert(window.additionalStrings.compare.limitExceed);
          return;
        
        } else{
          compareList.push(handle);
          comparelistContainer.classList.remove('--limit-exceed');
        }
      
      } else{
        var index = compareList.indexOf(handle);
        
        if (index !== -1) {
          compareList.splice(index, 1);
        }
      }
      localStorage.setItem('comparelist', JSON.stringify(compareList));
      
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
      
      if(comparelistOrganizer){
        comparelistOrganizer.innerText = compareList.length;
      }
      
      this.checkComparelistStatus();
    }
    
    checkComparelistStatus(){
      if(!this.dataset.handle) return;
      
      const allBtns = document.querySelectorAll('product-compare-button');
      const compareListStorage = localStorage.getItem('comparelist');
      const compareList = compareListStorage ? JSON.parse(compareListStorage) : [];
      
      allBtns.forEach(btn => {
        const handle = btn.dataset.handle;
        const anchor = btn.querySelector('a');
        const text = btn.querySelector('.pwb-text');
        
        if(compareList.includes(handle)){
          anchor.classList.add('--compare-active');
          text.innerHTML = window.accessibilityStrings.compareRemovebutton.replace('[product_name]', btn.dataset.product);
        
        } else{
          anchor.classList.remove('--compare-active');
          text.innerHTML = window.accessibilityStrings.compareAddbutton.replace('[product_name]', btn.dataset.product);
        }
      });
    }
  })
}