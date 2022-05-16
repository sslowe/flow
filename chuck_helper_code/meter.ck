class Meter extends Chugen
{
    //
    values

    fun float tick( float in )
    {

    }

    fun float value() {

    }

}



SawOsc s => LPF f => ADSR env => Meter m => dac;