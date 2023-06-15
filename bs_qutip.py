from qutip import *
import numpy as np

b = Bloch3d()
b.view = [45, 45]
b.bgcolor = 'black'
b.frame_num = 22
b.frame_color = 'white'
b.frame_radius = 0.005
b.sphere_alpha = 0.8
b.axes_alpha = 0
b.xlabel = ['X', '']
b.xlpos = [1.27, -1.27]
b.ylabel = ['Y', '']
b.ylpos = [1.27, -1.27]
b.zlabel = ['Z', '']
b.zlpos = [1.27, -1.27]
b.font_color = 'white'

v_len = np.sqrt(1.5)
vectors = [[v_len, 0, 0], [0, v_len, 0], [0, 0, v_len]]
b.add_vectors(vectors, 0.6)

b.show()
