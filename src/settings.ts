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
  public cards: FormattingSettingsCard[] = [this.event, this.category];
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


  public eventTextRotation = new formattingSettings.NumUpDown({
    name: "eventTextRotation",
    displayName: "Text Rotation",
    value: 0
  })
  
  public waterfall = new formattingSettings.ToggleSwitch({
    name: "waterfall",
    displayName: "Waterfall Mode",
    value: false
  })
  

  public name: string = "event";
    public displayName: string = "Event Settings";
    public slices: FormattingSettingsSlice[] = [
      this.eventFontColor, 
      this.fontColorOverride,
      this.eventFontSize, 
      this.eventTextRotation,
      this.waterfall
    ]
}

export class CategorySettings extends FormattingSettingsCard{

  public categoryFontSize = new formattingSettings.NumUpDown({
    name: "categoryFontSize",
    displayName: "Font Size",
    value: 13
  });



  public categoryTextRotation = new formattingSettings.NumUpDown({
    name: "categoryTextRotation",
    displayName: "Text Rotation",
    value: 0
  })

  public categoryGrayScale = new formattingSettings.ToggleSwitch({
    name: "categoryGrayScale",
    displayName: "Grayscale",
    value: true
  })
  
  
  public name: string = "category";
    public displayName: string = "Category Settings";
    public slices: FormattingSettingsSlice[] = [
      this.categoryFontSize, 
      this.categoryTextRotation,
      this.categoryGrayScale
    ]
}