import { Component, OnDestroy, OnInit } from '@angular/core';
import { LoggerService } from './logger.service';
import { BehaviorSubject } from 'rxjs';
import { map, filter } from 'rxjs/operators';

@Component({
  selector: 'app-hello',
  template: `
    <h1>Hello, {{name | async}}!</h1>
    <p>Today is {{date | date}}</p>
  `,
})
export class HelloComponent implements OnInit, OnDestroy {
  name = new BehaviorSubject<string>('Angular');
  refinedName = this.name.asObservable().pipe(
    filter(x => !!x),
    map(x => x + 'です'),
  );
  date = new Date();
  hello = () => {
    console.log('hello')
  }

  constructor(private logger: LoggerService) {
    this.logger.log('HelloComponent initialized.');
  }

  ngOnInit() {
    console.log('hello', this.date);
  }
  ngOnDestroy() {
    console.log('hello', this.date);
  }
}
