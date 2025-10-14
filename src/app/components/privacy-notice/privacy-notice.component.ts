// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

@Component({
    selector: 'c477-app-privacy-notice',
    standalone: true,
    imports: [CommonModule, MatButtonModule, MatIconModule],
    template: `
        <div class="privacy-page">
            <div class="privacy-header">
                <button mat-icon-button class="privacy-back" aria-label="Back" (click)="onBack()">
                    <mat-icon>arrow_back</mat-icon>
                </button>

                <img class="privacy-logo" src="/assets/DBT_logo_black.svg" alt="Department for Business & Trade" />
            </div>

            <div class="privacy-html" [innerHTML]="privacyHtml"></div>
        </div>
    `,
    styleUrls: ['./privacy-notice.css'],
})
export class PrivacyNoticeComponent {
    @Output() private readonly back = new EventEmitter<void>();
    readonly #router = inject(Router);

    constructor() {}

    public onBack(): void {
        if (this.back.observers.length) {
            this.back.emit();
        } else {
            this.#router.navigateByUrl('/');
        }
    }

    public privacyHtml = `
            <h1>Privacy Notice - IRIS</h1>

            <p>This privacy notice explains how the Department for Business and Trade (DBT) and the National Digital
                Twin Programme (NDTP), as a 'data controller', process personal data for the IRIS Pilot.</p>
            <p>This notice supplements our main privacy notice, which provides further information on how DBT processes
                personal data and sets out your rights regarding that personal data.</p>

            <h2>Personal data DBT will collect as part of the Pilot</h2>
            <p>DBT will collect the following categories of personal data:</p>
            <ul>
                <li><strong>Identifying data:</strong> name, username</li>
                <li><strong>Contact details:</strong> email address, phone number</li>
                <li><strong>Online identifiers:</strong> IP address, cookies, location data</li>
            </ul>

            <h2>Why DBT asks for this information</h2>
            <p>DBT collects this data to facilitate your access to the Pilot tool and to gain valuable insights into its
                usage patterns. The tool refers to a browser-based 3D/2D geospatial visualisation solution called IRIS.
            </p>
            <p>Your participation and provision of this information greatly assist us in refining and optimising the
                tool to meet your needs. DBT places a strong emphasis on safeguarding your data and strictly adheres to
                data protection regulations. We utilise this information exclusively to enhance your experience with our
                3D visualisation tool and do not employ it for any other purposes. Your privacy and data security are
                paramount to us.</p>
            <p>We will use the data only for the specific purposes for which it was collected, such as user
                authentication, providing support and assistance, optimising the Pilot tool, conducting usage analysis,
                and facilitating effective user communication.</p>

            <h2>The legal basis for processing your personal data</h2>
            <p><strong>Legal basis for processing:</strong></p>
            <ul>
                <li>Personal Data (Article 6(1) UK GDPR): (e) Processing is necessary for a task carried out in the
                    public interest or in the exercise of official authority vested in the controller.</li>
            </ul>
            <p>DBT will not collect any Special Category Data or Criminal Conviction Data as part of our data collection
                process.</p>
            <p>In some instances, we may process your data further for a compatible purpose and/or on other legal bases.
                For example, your data may be used for archiving, research, and/or statistical purposes. These are
                compatible purposes for further processing under UK GDPR, and your data will be subject to appropriate
                safeguards if used for such purposes.</p>

            <h2>How DBT processes personal data it receives</h2>
            <p>Once we receive your personal data, we are committed to handling it with care and responsibility, and our
                processing procedures are designed to ensure the protection of your privacy and the security of your
                information.</p>
            <p>Upon receipt, your data will be securely stored within:</p>
            <ul>
                <li>DBT - SharePoint site</li>
                <li>Informed Solutions - Infrastructure managed on behalf of DBT</li>
            </ul>
            <p>Where necessary, your data will be encrypted to prevent unauthorised access.</p>
            <p>Your privacy and data security are our top priorities, and we are dedicated to maintaining the
                confidentiality and integrity of your information throughout the processing journey. Once your personal
                data is no longer needed as part of the Pilot, any identifiers will be removed, and a de-identified
                dataset will remain for audit purposes.</p>

            <h2>Third Party Processors</h2>
            <p>We work with a trusted third-party processor, Informed Solutions, which manages the infrastructure on our
                behalf. Any data stored with third-party processors remains subject to comparable data handling
                techniques that we follow within DBT.</p>
            <p>These partnerships are founded on robust contractual agreements that mandate adherence to stringent
                security standards and uphold the confidentiality of your data. They are prohibited from utilising your
                data for any purpose beyond the scope of their contracted services, ensuring that your information
                remains protected and confidential.</p>
            <p>Additionally, we continuously monitor and evaluate these collaborations to maintain the integrity of your
                data and ensure compliance with our stringent privacy standards. We are committed to safeguarding your
                data, and our relationships with these trusted partners are aligned with this commitment.</p>

            <h2>Information sharing</h2>
            <p>We may share personal data you provide:</p>
            <ul>
                <li>With other government departments, public authorities, law enforcement agencies, and regulators</li>
                <li>With other third parties where we consider it necessary in order to further our functions as a
                    government department</li>
                <li>Where we are ordered to do so or where we are otherwise required to do so by law</li>
                <li>With third-party data processors as governed by contract</li>
            </ul>

            <h2>How long will DBT hold your data for</h2>
            <p>DBT will only retain your personal data until <strong>30 April 2026</strong> to fulfil the purposes of
                the Pilot, including satisfying any legal, accounting, or reporting requirements.</p>
            <p>If we decide that we need to process your personal data for a reason which is incompatible with the
                purposes for which we collected it, we will contact you to explain why we are doing this and why it is
                lawful to do so.</p>
            <p>We understand the importance of transparency and accountability in data management. Once your personal
                data is no longer needed for the purposes of the Pilot, we will take appropriate measures to delete it
                securely. We will also confirm the deletion of your data, providing you with peace of mind that your
                information has been appropriately handled.</p>


            <h2>Your rights</h2>
            <p>You have a number of rights available to you under UK data protection legislation, including:</p>
            <ul>
                <li>The right to request copies of the personal data we hold about you</li>
                <li>The right to request that we rectify information about you which you think is inaccurate or
                    incomplete</li>
                <li>The right to request that we restrict your data from further processing (in certain circumstances)
                </li>
                <li>The right to object to the processing of your data (in certain circumstances)</li>
                <li>The right to data portability (in certain circumstances)</li>
                <li>The right to request that we erase your data (in certain circumstances)</li>
                <li>The right not to be subject to a decision based solely on automated data processing</li>
            </ul>

            <p>You can contact DBT's Data Protection Officer for further information about how your data has been
                processed by the department or to make a complaint about how your data has been used. Please contact: <a
                    href="mailto:data.protection@businessandtrade.gov.uk"
                    class="privacy-notice-link">data.protection@businessandtrade.gov.uk</a>.
            </p>
            <p>You can also complain to the Information Commissioner's Office (ICO) at:</p>
            <address>
                Information Commissioner's Office<br>
                Wycliffe House<br>
                Water Lane<br>
                Wilmslow<br>
                Cheshire<br>
                SK9 5AF<br>
                Website: <a href="https://ico.org.uk/" class="privacy-notice-link">https://ico.org.uk/</a><br>
                Tel: 0303 123 1113
            </address>
            <p>You can find out more about your rights as a data subject, and details of how to contact our Data
                Protection Officer and the ICO in our main privacy notice: <a href="https://ico.org.uk/"
                    class="privacy-notice-link">https://ico.org.uk/</a></p>
  `;
}
