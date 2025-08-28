import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'currencyFormat',
  standalone: true
})
export class CurrencyFormatPipe implements PipeTransform {
  transform(value: number | string, currencySymbol: string = '₹'): string {
    if (value === null || value === undefined) {
      return `${currencySymbol}0.00`;
    }
    
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    
    if (isNaN(numValue)) {
      return `${currencySymbol}0.00`;
    }
    
    return `${currencySymbol}${numValue.toFixed(2)}`;
  }
}