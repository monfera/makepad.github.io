module.exports = require('shaders/quadshader').extend(function(proto){

	var types = require('types')
	var painter = require('painter')

	// special
	proto.props = {
		x1:0.,
		x2:0.,
		x3:0.,
		x4:0.,
		level:0.,
		borderRadius:4.,
		borderWidth:1.,
		closed:0,
		
		bgColor: {pack:'float12', value:'gray'},
		opColor: {pack:'float12', value:'gray'},
		borderColor: {pack:'float12', value:'gray'},

		errorAnim:{kind:'uniform', animate:1, value:[0,0,0,0]},

		opMargin:{kind:'uniform', value:2},
		noBounds: {kind:'uniform',value:0},
		turtleClip:{kind:'uniform',value:[-50000,-50000,50000,50000]},
		visible:{kind:'uniform', value:1.},
		tween: {kind:'uniform', value:2.},
		ease: {kind:'uniform', value:[0,0,1.0,1.0]},
		duration: {noTween:1., value:0.},
		delay: {styleLevel:1, value:0.},
		lockScroll:{kind:'uniform', noTween:1, value:1.}
	}
	
	proto.vertex = function(){$
		this.x = this.x1
		this.w = this.x4 - this.x1

		this.errorTime = 1.-this.animateUniform(this.errorAnim)

		this.vertexStyle()

		if(this.visible < 0.5){
			return vec4(0.)
		}

		var shift = vec2(this.x - this.viewScroll.x*this.lockScroll, this.y - this.viewScroll.y*this.lockScroll)
		var size = vec2(this.w, this.h)

		this.mesh.xy = (clamp(
			this.mesh.xy * size + shift, 
			max(this.turtleClip.xy, this.viewClip.xy),
			min(this.turtleClip.zw, this.viewClip.zw)
		) - shift) / size

		var pos = vec4(
			this.mesh.xy * size + shift, 
			0., 
			1.
		)

		return pos * this.viewPosition * this.camPosition * this.camProjection
	}
	
	proto.noInterrupt = 1

	proto.pixel = function(){$

		var p = this.mesh.xy * vec2(this.w, this.h)
		var antialias = 1./length(vec2(length(dFdx(p.x)), length(dFdy(p.y))))
		
		// background field
		var bgSize = vec2(.5*this.w, .5*this.h)
		var bgField = length(max(abs(p-bgSize) - (bgSize - vec2(this.borderRadius)), 0.)) - this.borderRadius
		var opBorderRadius = max(this.borderRadius -2.,0.)
		// operator field
		var opSize = vec2(.5*(this.x3-this.x2- this.opMargin*2.), .5*(this.h - this.opMargin*2.))
		var opField = length(max(abs(p - vec2(this.x2-this.x1+this.opMargin, this.opMargin)-opSize) - (opSize - vec2(opBorderRadius)), 0.)) - opBorderRadius
	
		var rip = (1.5+.5*sin(p.x*.4)+p.x)*(this.closed+this.errorTime)*10.
		bgField += rip
		opField += rip

		// mix the fields
		var finalBg = mix(this.borderColor, vec4(this.borderColor.rgb, 0.), clamp(bgField*antialias+1.,0.,1.))
		var finalBorder = mix(this.bgColor, finalBg, clamp((bgField+this.borderWidth) * antialias + 1., 0., 1.))

		return mix(this.opColor, finalBorder, clamp(opField * antialias + 1., 0., 1.))
	}

	proto.toolMacros = {
		stop:function(o, x1, x2, x3, x4, h){
			this.$PROPVARDEF()
			this.$PROP(o,'x1') = x1
			this.$PROP(o,'x2') = x2
			this.$PROP(o,'x3') = x3
			this.$PROP(o,'x4') = x4
			this.$PROP(o,'h') = h
		},
		$setTweenStart:function(o, v){
			this.$PROPVARDEF()
			this.$PROP(o, 'tweenStart') = v
		},
		start:function(y, level, style){
			this.$ALLOCDRAW(1, true)
			this.$WRITEPROPS({
				$fastWrite:true,
				duration:$proto.duration,
				y:y,
				closed:0,
				level:level,
				borderRadius:style.borderRadius,
				bgColor:style.bgColor,
				opColor:style.opColor,
				borderColor:style.borderColor,
				borderWidth:style.borderWidth,
			})
			return this.$PROPLEN() - 1
		}
	}
})