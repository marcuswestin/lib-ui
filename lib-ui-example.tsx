import { makeLayoutViews, makeTextView } from './ui-lib'

const colors = {
  CouchBrown: 'red',
  CupWhite: 'blue',
} as const

const spaces = {
  '10w': 10,
  '20w': 20,

  '10h': 10,
  '20h': 20,
} as const

let theme /*: Theme<typeof colors, typeof spaces>*/ = {
  colors, spaces
}

const themes = {
  'mobile': theme,
  'tablet': theme,
  'laptop': theme,
}


// let { Box, Col, Row } = makeLayoutViews(theme)

// const TitleText = makeTextView(themes.laptop, {
//   fontSize: 18,
//   fontWeight: '600',
// })
// function Foo() {
//   return (
//     <Col p={10}>
//       <TitleText CouchBrown></TitleText>
//     </Col>
//   )
// }

