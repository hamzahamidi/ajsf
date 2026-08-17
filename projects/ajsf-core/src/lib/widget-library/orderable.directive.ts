import {
  Directive,
  ElementRef,
  Input,
  NgZone,
  OnInit
  } from '@angular/core';
import { JsonSchemaFormService } from '../json-schema-form.service';


/**
 * OrderableDirective
 *
 * Enables array elements to be reordered by dragging and dropping.
 *
 * Only works for arrays that have at least two elements.
 *
 * Also detects arrays-within-arrays, and correctly moves either
 * the child array element or the parent array element,
 * depending on the drop targert.
 *
 * Listeners for movable element being dragged:
 * - dragstart: add 'dragging' class to element, set effectAllowed = 'move'
 * - dragover: set dropEffect = 'move'
 * - dragend: remove 'dragging' class from element
 *
 * Listeners for stationary items being dragged over:
 * - dragenter: add 'drag-target-...' classes to element
 * - dragleave: remove 'drag-target-...' classes from element
 * - drop: remove 'drag-target-...' classes from element, move dropped array item
 */
@Directive({
    // tslint:disable-next-line:directive-selector
    selector: '[orderable]',
    standalone: false
})
export class OrderableDirective implements OnInit {
  arrayLayoutIndex: string;
  element: any;
  overParentElement = false;
  overChildElement = false;
  @Input() orderable: boolean;
  @Input() layoutNode: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];

  constructor(
    private elementRef: ElementRef,
    private jsf: JsonSchemaFormService,
    private ngZone: NgZone
  ) { }

  ngOnInit() {
    if (this.orderable && this.layoutNode && this.layoutIndex && this.dataIndex) {
      this.element = this.elementRef.nativeElement;
      this.element.draggable = true;
      this.arrayLayoutIndex = 'move:' + this.layoutIndex.slice(0, -1).toString();

      this.ngZone.runOutsideAngular(() => {

        // Listeners for movable element being dragged:

        this.element.addEventListener('dragstart', (event) => {
          event.dataTransfer.effectAllowed = 'move';
          event.dataTransfer.setData('text', '');
          // Hack to bypass stupid HTML drag-and-drop dataTransfer protection
          // so drag source info will be available on dragenter
          const sourceArrayIndex = this.dataIndex[this.dataIndex.length - 1];
          sessionStorage.setItem(this.arrayLayoutIndex, sourceArrayIndex + '');
        });

        this.element.addEventListener('dragover', (event) => {
          if (event.preventDefault) { event.preventDefault(); }
          event.dataTransfer.dropEffect = 'move';
          return false;
        });

        // Listeners for stationary items being dragged over:

        this.element.addEventListener('dragenter', (event) => {
          // Part 1 of a hack, inspired by Dragster, to simulate mouseover and mouseout
          // behavior while dragging items - http://bensmithett.github.io/dragster/
          if (this.overParentElement) {
            return this.overChildElement = true;
          } else {
            this.overParentElement = true;
          }

          const sourceArrayIndex = sessionStorage.getItem(this.arrayLayoutIndex);
          if (sourceArrayIndex !== null) {
            if (this.dataIndex[this.dataIndex.length - 1] < +sourceArrayIndex) {
              this.element.classList.add('drag-target-top');
            } else if (this.dataIndex[this.dataIndex.length - 1] > +sourceArrayIndex) {
              this.element.classList.add('drag-target-bottom');
            }
          }
        });

        this.element.addEventListener('dragleave', (event) => {
          // Part 2 of the Dragster hack
          if (this.overChildElement) {
            this.overChildElement = false;
          } else if (this.overParentElement) {
            this.overParentElement = false;
          }

          const sourceArrayIndex = sessionStorage.getItem(this.arrayLayoutIndex);
          if (!this.overParentElement && !this.overChildElement && sourceArrayIndex !== null) {
            this.element.classList.remove('drag-target-top');
            this.element.classList.remove('drag-target-bottom');
          }
        });

        this.element.addEventListener('drop', (event) => {
          this.element.classList.remove('drag-target-top');
          this.element.classList.remove('drag-target-bottom');
          // Confirm that drop target is another item in the same array as source item
          const sourceArrayIndex = sessionStorage.getItem(this.arrayLayoutIndex);
          const destArrayIndex = this.dataIndex[this.dataIndex.length - 1];
          if (sourceArrayIndex !== null && +sourceArrayIndex !== destArrayIndex) {
            // Move array item
            this.jsf.moveArrayItem(this, +sourceArrayIndex, destArrayIndex);
          }
          sessionStorage.removeItem(this.arrayLayoutIndex);
          return false;
        });

      });
    }
  }
}
