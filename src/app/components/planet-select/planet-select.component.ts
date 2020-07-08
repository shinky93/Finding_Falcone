import { Component, OnInit, Input } from '@angular/core';
import { Planet } from 'src/app/models/planet';
import { SearchUnit } from 'src/app/models/search-unit';
import { Subscription } from 'rxjs';
import { StateService } from 'src/app/services/state.service';
import { ErrorService } from 'src/app/services/error.service';
import {FormControl} from '@angular/forms';
import {Observable} from 'rxjs';
import {map, startWith} from 'rxjs/operators';

@Component({
  selector: 'planet-select',
  templateUrl: './planet-select.component.html',
  styleUrls: ['./planet-select.component.css']
})
export class PlanetSelectComponent implements OnInit {
  myControl = new FormControl();
  filteredOptions: Observable<string[]>;
  @Input() id;
  planetOptions: any[];
  selectedPlanet = { value: '' };
  private selectedUnitSubscription: Subscription;

  constructor(private stateService: StateService, private errorService: ErrorService) {
  }

  ngOnInit() {
    //Init
    this.recalculateState();

    this.selectedUnitSubscription = this.stateService.selectedUnitChanged.subscribe((id) => {
      this.recalculateState();
    })
    this.filteredOptions = this.myControl.valueChanges
      .pipe(
        startWith(''),
        map(value => typeof value === 'string' ? value : value),
        map(name => name ? this._filter(name) : this.planetOptions.slice())
      );
  }

  

  displayFn(planetOptions: any): string {
   
    return planetOptions && planetOptions.name ? planetOptions.name : '';
  }

  private _filter(name: string): any[] {
    const filterValue = name.toString().toLowerCase();
    
    return this.planetOptions.filter(option => option.name.toString().toLowerCase().indexOf(filterValue) === 0);
  }
  recalculateState() {
    var searchUnits = this.stateService.getSelectedUnits();

    // Reset Selected Planet on reset
    if(searchUnits[this.id] && searchUnits[this.id].selectedPlanet) {
      this.selectedPlanet.value = '';
    }

    if (searchUnits[this.id] && searchUnits[this.id].selectedPlanet != null) {
      this.selectedPlanet.value = searchUnits[this.id].selectedPlanet.name;
    }
    this.stateService.getAllPlanets().subscribe(planets => {
      this.planetOptions = planets;
      // Add disabled flag to all options
      this.planetOptions = this.planetOptions.map((arr) => {
        arr.disabled = false;
        return arr;
      });

      //Go throught the selected serach units and find the things to disable
      for (var i = 0; i < searchUnits.length; i++) {
        if (searchUnits[i].selectedPlanet != null) {
          this.planetOptions = this.planetOptions.map((arr) => {
            if (searchUnits[i].selectedPlanet.name == arr.name) {
              arr.disabled = true;
            }
            return arr;
          });
        }
      }
    }, (err) => this.errorService.showError("Unable to fetch Planets!"));

  }

  setPlanetSelection(selectedPlanet: Planet) {
    this.stateService.setSelectedPlanet(this.id, selectedPlanet);
  }

  valueSelected(event) {
    if (event.option.value.name != null) {
      var selectedPlanet = this.stateService.getPlanetByValue(event.option.value.name);
      this.setPlanetSelection(selectedPlanet);
    } else {
      this.setPlanetSelection(null)
    }
  }

  ngOnDestroy() {
    this.selectedUnitSubscription.unsubscribe();
  }
}
