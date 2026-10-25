// spec: docs/qa/2026-10-21-ui-ux-audit.md

import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatDialog } from '@angular/material/dialog';
import { Category, CategoryService } from '@data-access-transaction';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import {
  CategoryEditDialogComponent,
  CategoryEditDialogData,
  CategoryEditDialogResult,
} from './category-edit-dialog.component';

const MOCK_CATEGORY: Category = {
  id: 'cat-1',
  name: 'Jedzenie',
  colorHex: '#16A34A',
  icon: 'restaurant',
  sortOrder: 10,
  isHidden: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-10-01T00:00:00.000Z',
  transactionType: 'expense',
};

const DIALOG_DATA: CategoryEditDialogData = {
  category: MOCK_CATEGORY,
};

function createMockDialogRef(): MatDialogRef<CategoryEditDialogComponent> {
  return { close: vi.fn() } as unknown as MatDialogRef<CategoryEditDialogComponent>;
}

describe('CategoryEditDialogComponent', () => {
  let mockDialogRef: MatDialogRef<CategoryEditDialogComponent>;
  const mockCategoryService = {
    updateCategoryAsync: vi.fn().mockResolvedValue(undefined),
    deleteCategoryAsync: vi.fn().mockResolvedValue(undefined),
  };

  async function setup(): Promise<void> {
    vi.clearAllMocks();
    mockDialogRef = createMockDialogRef();

    await render(CategoryEditDialogComponent, {
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: DIALOG_DATA },
        { provide: CategoryService, useValue: mockCategoryService },
        { provide: MatDialog, useValue: { open: vi.fn() } },
      ],
    });
  }

  // covers: docs/qa/2026-10-21-ui-ux-audit.md#UI-03
  it('should render dialog title "Edytuj kategorię"', async () => {
    await setup();
    expect(
      screen.getByRole('heading', { name: /edytuj kategorię/i }),
    ).toBeVisible();
  });

  // covers: docs/qa/2026-10-21-ui-ux-audit.md#UI-03
  it('should pre-fill form fields with category data', async () => {
    await setup();

    const nameInput = screen.getByRole('textbox', { name: /nazwa kategorii/i });
    expect(nameInput).toHaveValue('Jedzenie');

    const sortOrderInput = screen.getByRole('spinbutton', {
      name: /kolejność sortowania/i,
    });
    expect(sortOrderInput).toHaveValue(10);

    // Color swatch for the pre-selected color should have selected class
    const colorSwatches = screen.getAllByRole('radio', {
      name: /kolor/i,
    });
    const selectedColor = colorSwatches.find(
      (el) => el.getAttribute('aria-checked') === 'true',
    );
    expect(selectedColor).toBeTruthy();
  });

  // covers: docs/qa/2026-10-21-ui-ux-audit.md#UI-03
  it('should disable Save button when name is cleared', async () => {
    await setup();

    const nameInput = screen.getByRole('textbox', { name: /nazwa kategorii/i });
    await userEvent.clear(nameInput);

    const saveButton = screen.getByRole('button', { name: /zapisz/i });
    expect(saveButton).toBeDisabled();
  });

  // covers: docs/qa/2026-10-21-ui-ux-audit.md#UI-03
  it('should call updateCategoryAsync and close dialog on Save', async () => {
    await setup();

    const saveButton = screen.getByRole('button', { name: /zapisz/i });
    await userEvent.click(saveButton);

    expect(mockCategoryService.updateCategoryAsync).toHaveBeenCalledOnce();
    const updatedCategory: Category =
      mockCategoryService.updateCategoryAsync.mock.calls[0][0];
    expect(updatedCategory.id).toBe('cat-1');
    expect(updatedCategory.name).toBe('Jedzenie');

    expect(mockDialogRef.close).toHaveBeenCalledWith({
      action: 'save',
      category: expect.objectContaining({ id: 'cat-1' }),
    } satisfies CategoryEditDialogResult);
  });

  // covers: docs/qa/2026-10-21-ui-ux-audit.md#UI-03
  it('should update category name and save', async () => {
    await setup();

    const nameInput = screen.getByRole('textbox', { name: /nazwa kategorii/i });
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Nowa nazwa');

    const saveButton = screen.getByRole('button', { name: /zapisz/i });
    await userEvent.click(saveButton);

    const updatedCategory: Category =
      mockCategoryService.updateCategoryAsync.mock.calls[0][0];
    expect(updatedCategory.name).toBe('Nowa nazwa');
  });

  // covers: docs/qa/2026-10-21-ui-ux-audit.md#UI-03
  it('should close dialog without result on Cancel', async () => {
    await setup();

    const cancelButton = screen.getByRole('button', { name: /anuluj/i });
    await userEvent.click(cancelButton);

    expect(mockDialogRef.close).toHaveBeenCalledWith();
    expect(mockCategoryService.updateCategoryAsync).not.toHaveBeenCalled();
    expect(mockCategoryService.deleteCategoryAsync).not.toHaveBeenCalled();
  });

  // covers: docs/qa/2026-10-21-ui-ux-audit.md#UI-03
  it('should show confirmation and call deleteCategoryAsync on Delete', async () => {
    // Mock window.confirm
    const originalConfirm = window.confirm;
    window.confirm = vi.fn().mockReturnValue(true);

    await setup();

    const deleteBtn = screen.getByRole('button', {
      name: /usuń kategorię/i,
    });
    await userEvent.click(deleteBtn);

    expect(window.confirm).toHaveBeenCalledWith(
      expect.stringContaining('Jedzenie'),
    );
    expect(mockCategoryService.deleteCategoryAsync).toHaveBeenCalledWith(
      'cat-1',
    );
    expect(mockDialogRef.close).toHaveBeenCalledWith({
      action: 'delete',
      categoryId: 'cat-1',
    } satisfies CategoryEditDialogResult);

    window.confirm = originalConfirm;
  });

  // covers: docs/qa/2026-10-21-ui-ux-audit.md#UI-03
  it('should not delete when confirmation is cancelled', async () => {
    const originalConfirm = window.confirm;
    window.confirm = vi.fn().mockReturnValue(false);

    await setup();

    const deleteBtn = screen.getByRole('button', {
      name: /usuń kategorię/i,
    });
    await userEvent.click(deleteBtn);

    expect(window.confirm).toHaveBeenCalled();
    expect(mockCategoryService.deleteCategoryAsync).not.toHaveBeenCalled();
    expect(mockDialogRef.close).not.toHaveBeenCalled();

    window.confirm = originalConfirm;
  });

  // covers: docs/qa/2026-10-21-ui-ux-audit.md#UI-03
  it('should have Color picker with selectable swatches', async () => {
    await setup();

    const colorSwatches = screen.getAllByRole('radio', { name: /kolor/i });
    expect(colorSwatches.length).toBeGreaterThanOrEqual(10);

    // Click a different color
    const targetSwatch = colorSwatches.find(
      (el) => el.getAttribute('aria-checked') !== 'true',
    );
    expect(targetSwatch).toBeTruthy();
    if (!targetSwatch) { throw new Error('No unselected color found'); }
    await userEvent.click(targetSwatch);

    expect(targetSwatch.getAttribute('aria-checked')).toBe('true');
  });

  // covers: docs/qa/2026-10-21-ui-ux-audit.md#UI-03
  it('should have Icon picker with selectable icons', async () => {
    await setup();

    const iconRadios = screen.getAllByRole('radio', { name: /ikona/i });
    expect(iconRadios.length).toBeGreaterThanOrEqual(15);

    // Click a different icon
    const targetIcon = iconRadios.find(
      (el) => el.getAttribute('aria-checked') !== 'true',
    );
    expect(targetIcon).toBeTruthy();
    if (!targetIcon) { throw new Error('No unselected icon found'); }
    await userEvent.click(targetIcon);

    expect(targetIcon.getAttribute('aria-checked')).toBe('true');
  });

  // covers: docs/qa/2026-10-21-ui-ux-audit.md#UI-03
  it('should have all required action buttons', async () => {
    await setup();

    expect(
      screen.getByRole('button', { name: /zapisz/i }),
    ).toBeVisible();
    expect(
      screen.getByRole('button', { name: /usuń kategorię/i }),
    ).toBeVisible();
    expect(
      screen.getByRole('button', { name: /anuluj/i }),
    ).toBeVisible();
  });
});