import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UtlysningService, Utlysning } from '../utlysning.service';

interface FieldError {
  field: string;
  label: string;
}

@Component({
  selector: 'app-utlysning-detalj',
  imports: [FormsModule],
  templateUrl: './utlysning-detalj.component.html',
})
export class UtlysningDetaljComponent implements OnInit {
  private service = inject(UtlysningService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  utlysning!: Utlysning;
  isDirty = false;
  submitted = false;
  showErrorSummary = false;
  showModal = false;
  showUnsavedModal = false;
  showTaBortModal = false;
  showTaBortBekraftaModal = false;
  showToast = false;
  errors: FieldError[] = [];
  private pendingPath: string | null = null;
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit() {
    if (!this.service.utlysning) {
      this.router.navigate(['/utlysning/ny']);
      return;
    }
    this.utlysning = { ...this.service.utlysning, finansieringsmedel: [...this.service.utlysning.finansieringsmedel] };

    if (this.service.justSaved) {
      this.service.justSaved = false;
      this.showToast = true;
      this.toastTimer = setTimeout(() => { this.showToast = false; this.cdr.markForCheck(); }, 5000);
    }
  }

  markDirty() {
    this.isDirty = true;
  }

  hasError(field: string): boolean {
    return this.submitted && this.errors.some((e) => e.field === field);
  }

  scrollToField(field: string) {
    const el = document.getElementById('field-' + field);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  dismissErrors() {
    this.showErrorSummary = false;
  }

  spara() {
    this.submitted = true;
    this.errors = [];

    if (!this.utlysning.utlysningNamn.trim()) {
      this.errors.push({ field: 'utlysningNamn', label: 'Utlysningens namn saknas' });
    }
    if (!this.utlysning.startstoedformsnod) {
      this.errors.push({ field: 'startstoedformsnod', label: 'Startstödformsnod har ej valts' });
    }
    if (!this.utlysning.sprak) {
      this.errors.push({ field: 'sprak', label: 'Språk har ej valts' });
    }
    if (!this.utlysning.periodFran) {
      this.errors.push({ field: 'periodFran', label: 'Period från saknas' });
    }
    if (!this.utlysning.periodTill) {
      this.errors.push({ field: 'periodTill', label: 'Period till saknas' });
    }
    if (this.utlysning.finansieringsmedel.length === 0) {
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

  stangModal() {
    this.showModal = false;
  }

  bekraftaSpara() {
    this.showModal = false;
    this.service.utlysning = { ...this.utlysning, finansieringsmedel: [...this.utlysning.finansieringsmedel] };
    this.isDirty = false;
    this.submitted = false;
    this.showToast = true;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => { this.showToast = false; this.cdr.markForCheck(); }, 5000);
  }

  stangToast() {
    this.showToast = false;
    if (this.toastTimer) clearTimeout(this.toastTimer);
  }

  navigeraTill(path: string) {
    if (this.isDirty) {
      this.pendingPath = path;
      this.showUnsavedModal = true;
    } else {
      this.router.navigate([path]);
    }
  }

  stangUnsavedModal() {
    this.showUnsavedModal = false;
    this.pendingPath = null;
  }

  bekraftaNavigering() {
    this.showUnsavedModal = false;
    if (this.pendingPath) {
      this.router.navigate([this.pendingPath]);
    }
  }

  taBort() {
    const startDatum = new Date(this.utlysning.periodFran);
    const idag = new Date();
    if (startDatum <= idag) {
      this.showTaBortModal = true;
    } else {
      this.showTaBortBekraftaModal = true;
    }
  }

  stangTaBortModal() {
    this.showTaBortModal = false;
  }

  stangTaBortBekraftaModal() {
    this.showTaBortBekraftaModal = false;
  }

  bekraftaTaBort() {
    this.showTaBortBekraftaModal = false;
    this.router.navigate(['/utlysning/ny']);
  }

  tillbakatillLista() {
    this.navigeraTill('/utlysning/ny');
  }
}
