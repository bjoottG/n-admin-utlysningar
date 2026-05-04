import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UtlysningService } from '../utlysning.service';

interface TreeNode {
  label: string;
  children?: TreeNode[];
}

interface FieldError {
  field: string;
  label: string;
}

@Component({
  selector: 'app-ny-utlysning',
  imports: [FormsModule],
  templateUrl: './ny-utlysning.component.html',
})
export class NyUtlysningComponent {
  private router = inject(Router);
  private utlysningService = inject(UtlysningService);

  utlysningNamn = '';
  finansieringsmedel: string[] = [];
  diarienummer = '';
  diarieSystem = '';
  interntNamn = '';
  startstoedformsnod = '';
  sprak = '';
  periodFran = '2026-04-27T00:01';
  periodTill = '2026-04-27T23:59';
  ingress = '';
  beskrivning = '';

  submitted = false;
  showErrorSummary = false;
  showModal = false;
  showFinansieringsModal = false;
  selectedFinansieringsmedel = '';
  errors: FieldError[] = [];

  finansieringsAlternativ = [
    'Europeiska regionala utvecklingsfonden (ERUF)',
    'Europeiska socialfonden (ESF+)',
    'Europeiska havs- och fiskerifonden (EHFF)',
    'Nationell offentlig medfinansiering',
    'Privat medfinansiering',
    'Statlig finansiering',
    'Kommunal finansiering',
  ];

  // Tree selection state
  sel0: TreeNode | null = null;
  sel1: TreeNode | null = null;
  sel2: TreeNode | null = null;

  treeData: TreeNode[] = [
    { label: 'Audio Visual Incentive', children: [] },
    { label: 'ERUF ETC', children: [] },
    { label: 'ERUF Regionala program', children: [] },
    { label: 'EU 2027 ETC', children: [] },
    { label: 'EU 2027 FRO', children: [] },
    {
      label: 'EU 2027 REG',
      children: [
        { label: 'Skåne och Blekinge', children: [] },
        {
          label: 'Övre Norrland',
          children: [
            { label: '1 Ett konkurrenskraftigare och smartare Europa genom främjande av innovativ och smart ekonomisk omvandling och regional IKT-konnektivitet' },
            { label: '3 Ett mer sammanlänkat Europa genom förbättrad mobilitet och regional IKT-konnektivitet' },
            { label: '2 En grönare och koldioxidsnål övergång till en ekonomi med noll nettoutsläpp och ett motståndskraftigt Europa. Det ska göras genom främjande av en ren och rättvis energiomställning, gröna och blå investeringar, den cirkulära ekonomin, begränsning av klimatförändringar, klimatanpassning, riskförebyggande, riskhantering och hållbar mobilitet i städer' },
            { label: '1 Ett mer konkurrenskraftigt och smart Europa genom främjande av innovativ och smart ekonomisk omvandling och regional IKT-konnektivitet' },
          ],
        },
        { label: 'Mellersta Norrland', children: [] },
        { label: 'Norra Mellansverige', children: [] },
        { label: 'Västsverige', children: [] },
        { label: 'Småland och Öarna', children: [] },
        { label: 'Östra Mellansverige', children: [] },
        { label: 'Nationella regionalfondsprogrammet', children: [] },
        { label: 'Stockholm', children: [] },
      ],
    },
    { label: 'EU AMIF ärendetyp', children: [] },
    { label: 'EU POL ärendetyp', children: [] },
    { label: 'Företagsstöd', children: [] },
    { label: 'Kommersiell service', children: [] },
    { label: 'Korttidsarbete', children: [] },
    { label: 'Korttidsarbete 2021', children: [] },
    { label: 'Korttidsarbete 2021: juli till september', children: [] },
    { label: 'Projektmedel', children: [] },
    { label: 'Verksamhetsbidrag', children: [] },
  ];

  get stoedformPath(): string {
    if (!this.sel2) return '';
    const parts = ['EU-medel'];
    if (this.sel0) parts.push(this.sel0.label);
    if (this.sel1) parts.push(this.sel1.label);
    parts.push(this.sel2.label);
    return parts.join(' › ');
  }

  get hasAnyInput(): boolean {
    return !!(
      this.utlysningNamn.trim() ||
      this.startstoedformsnod ||
      this.sprak ||
      this.ingress.trim() ||
      this.beskrivning.trim() ||
      this.sel2
    );
  }

  selectL0(node: TreeNode) {
    this.sel0 = node;
    this.sel1 = null;
    this.sel2 = null;
  }

  selectL1(node: TreeNode) {
    this.sel1 = node;
    this.sel2 = null;
  }

  selectL2(node: TreeNode) {
    this.sel2 = node;
  }

  resetTree() {
    this.sel0 = null;
    this.sel1 = null;
    this.sel2 = null;
  }

  hasError(field: string): boolean {
    return this.submitted && this.errors.some((e) => e.field === field);
  }

  scrollToField(field: string) {
    const el = document.getElementById('field-' + field);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  laggTillFinansieringsmedel() {
    this.selectedFinansieringsmedel = '';
    this.showFinansieringsModal = true;
  }

  stangFinansieringsModal() {
    this.showFinansieringsModal = false;
  }

  bekraftaFinansieringsmedel() {
    if (this.selectedFinansieringsmedel) {
      this.finansieringsmedel.push(this.selectedFinansieringsmedel);
    }
    this.showFinansieringsModal = false;
  }

  dismissErrors() {
    this.showErrorSummary = false;
  }

  stangModal() {
    this.showModal = false;
  }

  bekraftaSpara() {
    this.showModal = false;
    this.utlysningService.utlysning = {
      utlysningNamn: this.utlysningNamn,
      diarienummer: this.diarienummer,
      diarieSystem: this.diarieSystem,
      interntNamn: this.interntNamn,
      startstoedformsnod: this.startstoedformsnod,
      sprak: this.sprak,
      periodFran: this.periodFran,
      periodTill: this.periodTill,
      ingress: this.ingress,
      beskrivning: this.beskrivning,
      finansieringsmedel: [...this.finansieringsmedel],
      stoedformPath: this.stoedformPath,
    };
    this.utlysningService.justSaved = true;
    this.router.navigate(['/utlysning/detalj']);
  }

  spara() {
    this.submitted = true;
    this.errors = [];

    if (!this.sel2) {
      this.errors.push({ field: 'stoedtrad', label: 'Detaljerad stödinformation har ej valts' });
    }
    if (!this.utlysningNamn.trim()) {
      this.errors.push({ field: 'utlysningNamn', label: 'Utlysningens namn saknas' });
    }
    if (!this.startstoedformsnod) {
      this.errors.push({ field: 'startstoedformsnod', label: 'Startstödformsnod har ej valts' });
    }
    if (!this.sprak) {
      this.errors.push({ field: 'sprak', label: 'Språk har ej valts' });
    }
    if (!this.periodFran) {
      this.errors.push({ field: 'periodFran', label: 'Period från saknas' });
    }
    if (!this.periodTill) {
      this.errors.push({ field: 'periodTill', label: 'Period till saknas' });
    }
    if (this.finansieringsmedel.length === 0) {
      this.errors.push({ field: 'finansieringsmedel', label: 'Det krävs minst ett finansieringsmedel' });
    }


    if (this.errors.length > 0) {
      this.showErrorSummary = true;
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    this.showErrorSummary = false;
    this.showModal = true;
  }
}
