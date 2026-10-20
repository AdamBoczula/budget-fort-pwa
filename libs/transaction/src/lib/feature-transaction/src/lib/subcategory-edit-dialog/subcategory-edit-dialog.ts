import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Subcategory, SubcategoryService } from '@data-access-transaction';

export type SubcategoryEditDialogData = {
  categoryId: string;
  subcategory?: Subcategory;
};

export type SubcategoryEditDialogResult = {
  subcategory: Subcategory;
};

@Component({
  selector: 'transaction-subcategory-edit-dialog',
  imports: [FormsModule, MatButtonModule, MatDialogModule, MatFormFieldModule, MatInputModule],
  templateUrl: './subcategory-edit-dialog.html',
  styleUrl: './subcategory-edit-dialog.scss',
})
export class SubcategoryEditDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<SubcategoryEditDialogComponent>);
  private readonly dialogData = inject<SubcategoryEditDialogData>(MAT_DIALOG_DATA);
  private readonly subcategoryService = inject(SubcategoryService);

  protected readonly isEditMode = !!this.dialogData.subcategory;

  protected name = this.dialogData.subcategory?.name ?? '';
  protected categoryId = this.dialogData.categoryId;

  protected get canSave(): boolean {
    return this.name.trim().length > 0 && !!this.categoryId;
  }

  protected async save(): Promise<void> {
    if (!this.canSave) {
      return;
    }

    if (this.isEditMode && this.dialogData.subcategory) {
      const updated: Subcategory = {
        ...this.dialogData.subcategory,
        name: this.name.trim(),
      };
      await this.subcategoryService.updateSubcategoryAsync(updated);
      this.dialogRef.close({ subcategory: updated });
    } else {
      await this.subcategoryService.upsertSubcategoryAsync(this.categoryId, this.name.trim());
      this.dialogRef.close({
        subcategory: { id: '', categoryId: this.categoryId, name: this.name.trim() },
      });
    }
  }

  protected cancel(): void {
    this.dialogRef.close();
  }
}
