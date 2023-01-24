/*
 *  Power BI Visualizations
 *
 *  Copyright (c) Microsoft Corporation
 *  All rights reserved.
 *  MIT License
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the ""Software""), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in
 *  all copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */

"use strict";

import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";
import { dataViewObjectsParser } from "powerbi-visuals-utils-dataviewutils";
import DataViewObjectsParser = dataViewObjectsParser.DataViewObjectsParser;
import FormattingSettingsCard = formattingSettings.Card;
import FormattingSettingsSlice = formattingSettings.Slice;
import FormattingSettingsModel = formattingSettings.Model;


export class VisualSettingsModel extends FormattingSettingsModel {
  public event: EventSettings = new EventSettings();
  public category: CategorySettings = new CategorySettings();
  public general: GeneralSettings = new GeneralSettings();
  public cards: FormattingSettingsCard[] = [this.event, this.category, this.general];
}


export class EventSettings extends FormattingSettingsCard{
  public eventFontColor = new formattingSettings.ColorPicker({
    name: "eventFontColor",
    displayName: "Font Color",
    value: {value:"#ffffff"}
  });

  public fontColorOverride = new formattingSettings.ToggleSwitch({
    name: "fontColorOverride",
    displayName: "Override Font Color",
    value: false
  })
  
  public eventFontSize = new formattingSettings.NumUpDown({
    name: "eventFontSize",
    displayName: "Font Size",
    value: 7
  });


  public eventTextRotation = new formattingSettings.ItemDropdown({
    name: "eventTextRotation",
    displayName: "Text Rotation",
    value:       {
      "value": "0",
      "displayName": "Normal",
    },
    items: [
      {
          "value": "0",
          "displayName": "Normal"
      },
      {
          "value": "90",
          "displayName": "Clockwise"
      },
      {
          "value": "-90",
          "displayName": "Counter-Clockwise"
      },
      {
          "value": "180",
          "displayName": "Flipped"
      }
    ]       
  })
  
  public waterfall = new formattingSettings.ToggleSwitch({
    name: "waterfall",
    displayName: "Waterfall Mode",
    value: false
  })

  public paddingType = new formattingSettings.ItemDropdown({
    name: "paddingType",
    displayName: "Padding Type",
    value: {
      "value": "1",
      "displayName": "Days"
    },
    items:[
      {
          "value": "1",
          "displayName": "Days"
      },
      {
          "value": "7",
          "displayName": "Weeks"
      },
      {
          "value": "30",
          "displayName": "Months"
      },
      {
          "value": "365",
          "displayName": "Years"
      }
    ]
  })

  public paddingAmount = new formattingSettings.NumUpDown({
    name: "paddingAmount",
    displayName: "Padding Amount",
    value: 0
  })
  

  public name: string = "event";
    public displayName: string = "Event Settings";
    public slices: FormattingSettingsSlice[] = [
      this.eventFontColor, 
      this.fontColorOverride,
      this.eventFontSize, 
      this.eventTextRotation,
      this.waterfall,
      this.paddingType,
      this.paddingAmount
    ]
}

export class CategorySettings extends FormattingSettingsCard{

  public categoryFontSize = new formattingSettings.NumUpDown({
    name: "categoryFontSize",
    displayName: "Font Size",
    value: 13
  });



  public categoryTextRotation = new formattingSettings.ItemDropdown({
    name: "categoryTextRotation",
    displayName: "Text Rotation",
    value:       {
      "value": "0",
      "displayName": "Normal",
    },
    items: [
      {
          "value": "0",
          "displayName": "Normal"
      },
      {
          "value": "90",
          "displayName": "Clockwise"
      },
      {
          "value": "-90",
          "displayName": "Counter-Clockwise"
      },
      {
          "value": "180",
          "displayName": "Flipped"
      }
  ]       
  })
  
  
  public name: string = "category";
    public displayName: string = "Category Settings";
    public slices: FormattingSettingsSlice[] = [
      this.categoryFontSize, 
      this.categoryTextRotation
    ]
}

export class GeneralSettings extends FormattingSettingsCard{
  public markCurrentDay = new formattingSettings.ToggleSwitch({
    name: "markCurrentDay",
    displayName: "Mark Current Day",
    value: true
  })
  
  public colorScheme = new formattingSettings.ItemDropdown({
    displayName: "Color Scheme",
    items: [
      {
          "value": "Greys",
          "displayName": "Greys",
      },
      {
          "value": "Blues",
          "displayName": "Blues",
      },
      {
          "value": "Greens",
          "displayName": "Greens",
      },
      {
          "value": "Oranges",
          "displayName": "Oranges",
      },
      {
          "value": "Reds",
          "displayName": "Reds",
      },
      {
          "value": "BuGn",
          "displayName": "BuGn",
      },
      {
          "value": "OrRd",
          "displayName": "OrRd",
      },
      {
          "value": "PuBu",
          "displayName": "PuBu",
      },
      {
          "value": "YlGnBu",
          "displayName": "YlGnBu",
      },
      {
          "value": "Cividis",
          "displayName": "Cividis",
      },
      {
          "value": "Viridis",
          "displayName": "Viridis",
      },
      {
          "value": "Inferno",
          "displayName": "Inferno",
      },
      {
          "value": "Magma",
          "displayName": "Magma",
      },
      {
          "value": "Plasma",
          "displayName": "Plasma",
      },
      {
          "value": "Warm",
          "displayName": "Warm",
      },
      {
          "value": "Cool",
          "displayName": "Cool",
      },
      {
          "value": "CubehelixDefault",
          "displayName": "CubehelixDefault",
      },
      {
          "value": "Turbo",
          "displayName": "Turbo",
      },
      {
          "value": "BrBG",
          "displayName": "BrBG",
      },
      {
          "value": "Spectral",
          "displayName": "Spectral",
      },
      {
          "value": "Sinebow",
          "displayName": "Sinebow",
      }
  ],
    name: "colorScheme",
    value: {value: "Greens",
            displayName: "Greens"}
  })

  public grayScale = new formattingSettings.ToggleSwitch({
    name: "grayScale",
    displayName: "Grayscale",
    value: true
  })

  public name: string = "general";
    public displayName: string = "Visual Settings";
    public slices: FormattingSettingsSlice[] = [
      this.markCurrentDay,
      this.colorScheme,
      this.grayScale
    ]

}
