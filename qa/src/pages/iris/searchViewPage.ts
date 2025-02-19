import { expect, Page } from '@playwright/test';
import PlaywrightWrapper from '../../helper/wrapper/PlaywrightWrappers';

export default class SearchViewPage {
 
  private readonly base: PlaywrightWrapper;

  constructor(private readonly page: Page) {
    this.base = new PlaywrightWrapper(page);
  }

  private readonly Elements = {
    checkTitle:'//title',
    inputPostcode:"//input[@aria-label='Search by address']",
    selectPostcode: "//mat-option/span[.='$DATAVALUE$']",
    selectFirstDDAddress: "//span[@class='mdc-list-item__primary-text']",
  };

  async verifyIrisSearchViewPage() {
    await this.page.goto(process.env.IRISURL);

    while (await this.page.locator("//arc-container//p[.='Loading data...']").isVisible()) {
      await this.page.waitForTimeout(500); // Waits 500ms before checking again
    }
    
    await expect(this.page).toHaveTitle('IRIS')

  }


  async enterSearchString(searchString: any) {
    
    await this.page.type(this.Elements.inputPostcode, searchString);

  }


  async selectAddressFromDropdown(searchString:any){

   /* await this.page.click(this.Elements.selectPostcode.replace('$DATAVALUE$',searchString));
    await this.page.fill(this.Elements.inputPostcode, searchString);
    await this.page.click(this.Elements.selectPostcode.replace('$DATAVALUE$',searchString));
*/

    await this.page.click(this.Elements.selectFirstDDAddress);
  }


 }
