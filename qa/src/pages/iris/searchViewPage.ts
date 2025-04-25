import { expect, Page } from '@playwright/test';
import PlaywrightWrapper from '../../helper/wrapper/PlaywrightWrappers';
import { basePage } from '../../hooks/basePage';

export default class SearchViewPage {
    private readonly base: PlaywrightWrapper;

    constructor(private readonly page: Page) {
        this.base = new PlaywrightWrapper(page);
    }

    private readonly Elements = {
        checkTitle: '//title',
        inputPostcode: "//input[@aria-label='Search by address']",
        selectPostcode: "//mat-option/span[.='$DATAVALUE$']",
        selectFirstDDAddress: "//span[@class='mdc-list-item__primary-text']",
        msgLoadingData: "//arc-container//p[.='Loading data...']",
    };

    async verifyIrisSearchViewPage() {
        await this.page.goto(process.env.IRISURL);

        // TODO: Needs to reword on the Loading data once arc-containers are removed as part of reskin
        while (await this.page.locator(this.Elements.msgLoadingData).isVisible()) {
            await this.page.waitForTimeout(500); // Waits 500ms before checking again
        }

        await expect(this.page).toHaveTitle('IRIS');
    }

    async enterSearchString(searchString: any) {
        await this.page.type(this.Elements.inputPostcode, searchString);
    }

    async selectAddressFromDropdown(searchString: any) {
        /* 
        // TODO: Once the base framework is approved, the postcode level search will be included
        await this.page.click(this.Elements.selectPostcode.replace('$DATAVALUE$',searchString));
        await this.page.fill(this.Elements.inputPostcode, searchString);
        await this.page.click(this.Elements.selectPostcode.replace('$DATAVALUE$',searchString));
        */

        await this.page.click(this.Elements.selectFirstDDAddress);
    }

    async clickMapLocation(x : number, y : number) {
        await this.page.mouse.click(x, y);
        await basePage.sleep(1000);
    }

    async verifyDetailsPanelVisible() {
        await basePage.sleep(10000);

        const detailsPanel = await this.page.locator('.details-panel');
        await expect(detailsPanel).toBeVisible();

    }

    async zoomInWithButton() {
        const zoomInButton = this.page.getByRole("button", { name: "Zoom in" });
        await zoomInButton.click({ force: true });
      }

      async zoomOutWithButton() {
        const zoomOutButton = this.page.getByRole("button", { name: "Zoom out" });
        await zoomOutButton.click({ force: true });
      }
    
      async zoomOnTheMapWithScreenshotComparison() {
        const beforeZoom = await this.page.screenshot();
        await this.page.waitForTimeout(2000);
        this.zoomInWithButton();
        await this.page.waitForTimeout(2000);
        const afterZoom = await this.page.screenshot();
        expect(afterZoom).not.toEqual(beforeZoom);
      }

      async zoomOutOfTheMap(times : number) {
        for(let i = 0; i < times; i++) {
            this.zoomOutWithButton();
            this.page.waitForTimeout(1000);
        }
      }

      async verifyWardDetailsPanelVisible() {
        await expect(this.page.locator('.mapboxgl-popup-content')).toBeVisible();
      }

      async panWithScreenshotComparison() {
        const beforePan = await this.page.screenshot();
        await this.panAroundTheMap();
        const afterPan = await this.page.screenshot();
        expect(beforePan).not.toEqual(afterPan);
      }

      async panAroundTheMap() {
        await this.page.mouse.move(800, 400);
        await this.page.mouse.down();
        await this.page.mouse.move(1000, 400, { steps: 20 });
        await this.page.mouse.up();
      }

      async addPropertyFlag() {
        await this.page.getByRole('tab', { name: 'Flag' }).click();
        await basePage.sleep(500);
        await this.page.locator('button:has-text("Add a flag")').click();
        await basePage.sleep(500);
        
        const createFlagButton = this.page.getByRole('button', { name: 'Create' });
        await expect(createFlagButton).toBeVisible();
        await createFlagButton.click();

        await basePage.sleep(500);
        await expect(this.page.locator('button:has-text("Remove flag")')).toBeVisible();
      }

      async drawFilterArea() {
        await this.zoomInWithButton();
        await basePage.sleep(1000);
        await this.zoomInWithButton();

        await this.page.getByRole("button", { name: "Draw filter area" }).click();

        const canvas = await this.page.locator('#map canvas.mapboxgl-canvas');

        await canvas.click({ position: { x: 300, y: 300 } });
        await canvas.click({ position: { x: 400, y: 300 } });
        await canvas.click({ position: { x: 400, y: 400 } });
        await canvas.click({ position: { x: 300, y: 400 } });
        await canvas.click({ position: { x: 300, y: 300 } });

        await basePage.sleep(1000);
      }

      async verifyFilteredPropertiesPanelVisible() {
        const panel = this.page.locator('c477-info-panel.primary.expand');
        await expect(panel).toBeVisible();
        await expect(panel).toContainText('results in view');
      }

      async filterByEPC() {
        await this.page.getByLabel('EPC Rating').click();
        await this.page.locator('mat-option').getByText('EPC: A').click();
      }

      async addNewFilter(filterType : string) {
        let text = await this.page.locator('text=/\\d+ results in view/').innerText();
        let match = text.match(/\d+/);
        const beforeResultsCount = match ? parseInt(match[0], 10) : 0;

        switch(filterType) {
            case "EPC Rating":
                await this.filterByEPC();
                break;
            default:
                console.log('No Matching filter types');
                break;
        }

        basePage.sleep(1000);

        text = await this.page.locator('text=/\\d+ results in view/').innerText();
        match = text.match(/\d+/);
        const afterResultsCount = match ? parseInt(match[0], 10) : 0;

        expect(beforeResultsCount).toBeGreaterThan(afterResultsCount);
      }
}
