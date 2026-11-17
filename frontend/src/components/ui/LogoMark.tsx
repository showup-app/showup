// Animated logo drawing written with AI assistance (Claude)
import { useEffect, useState } from "react";
import { Animated, Easing } from "react-native";
import Svg, { Path } from "react-native-svg";
import { useTheme } from "@react-navigation/native";

const LOGO_PATH =
	"M10.0015 844.37 C26.7883 958.148 127.51 1034 261.805 1034 C396.1 1034 513.608 939.185 513.608 787.482 C513.608 635.778 396.1 559.926 261.805 503.037 C144.297 446.148 10.0015 389.259 10.0015 237.556 C10.0015 85.8518 110.723 10 245.018 10 C379.313 10 513.608 85.8518 513.608 237.556 V825.407 C513.608 880.73 533.063 933.786 567.692 972.905 C602.322 1012.02 649.29 1034 698.264 1034 C747.237 1034 794.205 1012.02 828.835 972.905 C863.465 933.786 882.919 880.73 882.919 825.407 V85.8519 L731.838 256.519 L882.919 85.8519 L1034 256.519";

const PATH_LENGTH = 4940;

const AnimatedPath = Animated.createAnimatedComponent(Path);

type LogoMarkProps = {
	size?: number;
	animated?: boolean;
	duration?: number;
	strokeWidth?: number;
	onDone?: () => void;
};

const LogoMark = ({ size = 120, animated = false, duration = 2600, strokeWidth = 56, onDone }: LogoMarkProps) => {
	const theme = useTheme();
	const [offset] = useState(() => new Animated.Value(animated ? PATH_LENGTH : 0));

	// Padding so thick strokes aren't clipped at the edges
	const pad = strokeWidth / 2;
	const viewBox = `${-pad} ${-pad} ${1044 + pad * 2} ${1044 + pad * 2}`;

	useEffect(() => {
		if (!animated) return;
		Animated.timing(offset, {
			toValue: 0,
			duration,
			easing: Easing.inOut(Easing.cubic),
			useNativeDriver: false,
		}).start(() => onDone?.());
	}, [animated, duration, offset, onDone]);

	return (
		<Svg width={size} height={size} viewBox={viewBox} fill="none">
			<AnimatedPath
				d={LOGO_PATH}
				stroke={theme.colors.textSecondary}
				strokeWidth={strokeWidth}
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeDasharray={PATH_LENGTH}
				strokeDashoffset={offset}
			/>
		</Svg>
	);
};

export default LogoMark;
